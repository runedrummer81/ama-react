import express from "express";
import { loadTopicStats, saveTopicStats } from "../data/messages.js";
import { loadAnswers, findBestAnswer } from "../data/answers.js";
import { detectAttack, attackReply } from "../data/security.js";
import { askGroq } from "../data/groq.js";
import { buildKnowledge } from "../data/knowledge.js";
const MAX_QUESTION_LENGTH = 280; // samme som maxlength i klienten

// Kategorier, der ikke er et emne (se også buildContext)
const NOT_A_TOPIC = [
  "fallback",
  "opfoelgning",
  "opfoelgning-uden-emne",
  "angreb",
];

const MAX_HISTORY = 40; // højst så mange beskeder tager vi imod
const MAX_HISTORY_TEXT = 1500; // højst så mange tegn pr. besked

// Klienten sender samtalen med. Vi stoler ikke blindt på den: kun kendte
// felter, kun de seneste beskeder, og tekster har en maksimal længde.
function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (m) =>
        (m?.type === "question" || m?.type === "answer") &&
        typeof m.text === "string",
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      type: m.type,
      text: m.text.slice(0, MAX_HISTORY_TEXT),
      category: typeof m.category === "string" ? m.category : undefined,
      pool: typeof m.pool === "string" ? m.pool : undefined,
      variant: Number.isInteger(m.variant) ? m.variant : undefined,
    }));
}

function sanitizeQuestion(input) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "");
}

// Ud fra chatten indtil nu: hvad talte vi sidst om, og hvilke svar-varianter
// har vi allerede brugt? (bruges til "hvorfor?", "igen"-svar og undgå gentagelser)
function buildContext(messages) {
  const previousAnswers = messages.filter(
    (message) => message.type === "answer" && message.category,
  );

  const usedVariants = {};
  for (const message of previousAnswers) {
    const key = `${message.category}:${message.pool}`;
    usedVariants[key] ??= [];
    usedVariants[key].push(message.variant);
  }

  // Fallback og "det var alt"-svar er ikke emner, man kan uddybe, så vi
  // husker det seneste rigtige emne.
  const notATopic = ["fallback", "opfoelgning", "angreb"];
  const lastTopicAnswer = previousAnswers
    .filter((message) => !notATopic.includes(message.category))
    .at(-1);
  const lastCategory = lastTopicAnswer ? lastTopicAnswer.category : "";

  return { lastCategory, usedVariants };
}

const router = express.Router();

router.post("/", async (request, response) => {
  if (typeof request.body?.question !== "string") {
    response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
    return;
  }

  const messages = cleanHistory(request.body.history);
  const topicStats = await loadTopicStats();
  const question = sanitizeQuestion(request.body.question).trim();

  if (question.length > MAX_QUESTION_LENGTH) {
    response.status(400).json({
      error: `Spørgsmålet må højst være ${MAX_QUESTION_LENGTH} tegn.`,
    });
    return;
  }

  if (!question) {
    response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
    return;
  }

  const answers = await loadAnswers();
  const context = buildContext(messages);
  const attempts = messages.filter(
    (message) => message.type === "answer" && message.category === "angreb",
  ).length;

  const result = detectAttack(question)
    ? {
        matched: true,
        category: "angreb",
        pool: "main",
        variant: 0,
        answer: attackReply(attempts),
        image: null,
      }
    : findBestAnswer(question, answers, context);

  if (result.category !== "angreb") {
    const history = messages.map((m) => ({
      role: m.type === "question" ? "user" : "assistant",
      content: m.text,
    }));
    history.push({ role: "user", content: question });

    // Ingen emne ramt ("hvorfor?", "fortæl mere")? Så bruger vi det sidste emne.
    const category = NOT_A_TOPIC.includes(result.category)
      ? context.lastCategory
      : result.category;
    const knowledge = buildKnowledge(answers, category);

    result.answer = await askGroq(history, knowledge);
  }

  const message = {
    type: "question",
    text: question,
    createdAt: new Date().toISOString(),
  };

  const answerMessage = {
    type: "answer",
    text: result.answer,
    createdAt: new Date().toISOString(),
    category: result.category,
    pool: result.pool,
    variant: result.variant,
  };
  // Valgfrit billede fra answers.json ({ src, alt }).
  if (result.image) answerMessage.image = result.image;

  // Spørgsmål uden træffer tælles under "ukendt", så du kan se, hvad besøgende
  // spørger om, som botten endnu ikke kan svare på.
  const statKey = result.matched ? result.category : "ukendt";
  topicStats[statKey] = (topicStats[statKey] ?? 0) + 1;

  await saveTopicStats(topicStats);

  response.status(201).json({ question: message, answer: answerMessage });
});

export default router;

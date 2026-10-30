import { fillTokens } from "./answers.js";

function groupToText(group) {
  const parts = [group.answers[0], ...(group.more ?? [])];
  return fillTokens(parts.join(" "));
}

export function buildKnowledge(answers, categoryName) {
  const basics = answers.find((group) => group.category === "om-mig");
  const topics = [...new Set(answers.map((group) => group.topic))].filter(
    Boolean,
  );

  const current = answers.find((group) => group.category === categoryName);
  const related = current?.topic
    ? answers.filter((group) => group.topic === current.topic)
    : current
      ? [current]
      : [];

  return [
    "Grundfakta:",
    `- ${groupToText(basics)}`,
    `Emner Rune kan fortælle mere om: ${topics.join(", ")}.`,
    related.length > 0 ? "Om det emne, brugeren spørger om lige nu:" : "",
    ...related.map((group) => `- ${groupToText(group)}`),
  ]
    .filter(Boolean)
    .join("\n");
}

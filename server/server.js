import express from "express";
import messagesRouter from "./routes/messages.js";
import answersRouter from "./routes/answers.js";
import cors from "cors";

const app = express();
const port = process.env.PORT ?? 3004;

console.log("GROQ_API_KEY loaded:", Boolean(process.env.GROQ_API_KEY));

app.post("/api/test-groq", async (request, response) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: "GROQ_API_KEY mangler i .env" });
    return;
  }

  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: "Hej! Svar med en kort hilsen." }],
      }),
    },
  );

  const data = await groqResponse.json();

  if (!groqResponse.ok) {
    response.status(groqResponse.status).json(data);
    return;
  }

  response.json({ reply: data.choices[0].message.content });
});

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));

app.use("/messages", messagesRouter);
if (process.env.ENABLE_ANSWERS_API === "true") {
  app.use("/answers", answersRouter);
}

app.use((request, response) => {
  response.status(404).json({ error: "Ukendt sti" });
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ error: error.message });
});

app.listen(port, (error) => {
  if (error) {
    console.error("Kunne ikke starte serveren:", error.message);
    return;
  }
  console.log(`Server is running at http://localhost:${port}`);
});

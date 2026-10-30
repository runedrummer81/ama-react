const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3004";

export async function getMessages() {
  const response = await fetch(`${API_URL}/messages`);
  if (!response.ok) throw new Error("Kunne ikke hente beskeder");
  return response.json();
}

// Returnerer { question, answer }
export async function postQuestion(question) {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Noget gik galt");
  return data;
}

export async function deleteMessages() {
  const response = await fetch(`${API_URL}/messages`, { method: "DELETE" });
  if (!response.ok) throw new Error("Kunne ikke starte en ny chat");
}

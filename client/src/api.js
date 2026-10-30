const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3004";

export async function postQuestion(question, history) {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Noget gik galt");
  return data;
}

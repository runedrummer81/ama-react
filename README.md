# Rune-amabot (React)

## Kør projektet

```bash
# Terminal 1 – server (port 3004)
cd server
npm install
npm run dev

# Terminal 2 – klient (port 5173)
cd client
npm install
npm run dev
```

Åbn http://localhost:5173

## Struktur

- `client/` – Vite + React. `src/App.jsx` styrer faserne (velkomst → chat),
  `src/components/` indeholder resten. `src/bg.js` (matrix + grid-gulv) er
  uændret og loades efter første render.
- `server/` – Express. Svarene findes stadig med keyword-matching i
  `data/answers.json`. Næste trin er at skifte det ud med Groq.

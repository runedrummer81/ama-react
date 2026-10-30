import { useEffect, useState } from "react";

const GLYPHS = "01ABCDEF#$%&*<>/=+?";
const TICK_MS = 45; // hvor ofte tegnene flimrer (ms)

// De første `revealed` tegn vises rigtigt, resten er tilfældige tegn.
function scramble(text, revealed) {
  return text
    .split("")
    .map((char, index) => {
      if (char === " ") return " ";
      if (index < revealed) return char;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join("");
}

// "2026-09-29T08:38:42.670Z" -> "10:38" (lokal tid). Tomt hvis datoen mangler.
function formatTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function Message({ message }) {
  const time = formatTime(message.createdAt);
  // message.animate sættes kun på nye svar (ikke på dem, der hentes ved load)
  const [decrypting, setDecrypting] = useState(Boolean(message.animate));
  const [text, setText] = useState(
    message.animate ? scramble(message.text, 0) : message.text,
  );

  useEffect(() => {
    if (!message.animate) return;

    const hold = 1000;
    const duration = 900;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.max((elapsed - hold) / duration, 0), 1);
      const revealed = Math.floor(progress * message.text.length);

      setText(scramble(message.text, revealed));

      if (progress === 1) {
        clearInterval(timer);
        setText(message.text);
        setDecrypting(false);
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [message.animate, message.text]);

  return (
    <article className={`${message.type}${decrypting ? " is-decrypting" : ""}`}>
      {time && (
        <time dateTime={message.createdAt}>{decrypting ? "--:--" : time}</time>
      )}
      <p>{text}</p>
    </article>
  );
}

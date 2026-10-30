import { useEffect, useRef, useState } from "react";
import { MAX_LENGTH } from "../constants.js";
import MessageList from "./MessageList.jsx";
import SendIcon from "./SendIcon.jsx";

export default function ChatWindow({
  visible,
  anim, // null | "opening" | "closing"
  messages,
  onSend,
  onNewChat,
}) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  const panelClass = [
    "messages",
    !visible && "is-hidden",
    anim === "opening" && "is-opening",
    anim === "closing" && "is-closing",
  ]
    .filter(Boolean)
    .join(" ");

  function handleSubmit(event) {
    event.preventDefault();
    const question = text.trim();
    if (!question) return;

    setText("");
    inputRef.current?.focus();
    onSend(question);
  }

  return (
    <div
      id="messages"
      className={panelClass}
      role="log"
      aria-live="polite"
      aria-label="Chat historik"
    >
      <div className={`chat-toolbar${visible ? "" : " is-hidden"}`}>
        <div className="chat-tab">
          <button
            type="button"
            id="clear-messages-button"
            className="tab-btn"
            aria-label="Ny chat"
            onClick={onNewChat}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>NY_CHAT</span>
          </button>
        </div>
      </div>
      <div className="messages-scanlines" aria-hidden="true"></div>
      <div className="messages-vignette" aria-hidden="true"></div>
      <div className="messages-grain" aria-hidden="true"></div>
      <div className="messages-sheen" aria-hidden="true"></div>

      <MessageList messages={messages} />

      <form
        className="chat-input messages-input-bar"
        id="chat-input-form"
        autoComplete="off"
        onSubmit={handleSubmit}
      >
        <label htmlFor="chat-question">Skriv din besked</label>
        <input
          id="chat-question"
          name="question"
          type="text"
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Skriv din besked…"
          required
          maxLength={MAX_LENGTH}
        />
        <span
          className={`char-counter${text.length >= MAX_LENGTH ? " char-counter--limit" : ""}`}
        >
          {text.length}/{MAX_LENGTH}
        </span>
        <button
          type="submit"
          id="chat-send-btn"
          aria-label="Send"
          disabled={text.length === 0}
        >
          <SendIcon />
        </button>
      </form>

      <div className="messages-horizon-gap" aria-hidden="true"></div>
    </div>
  );
}

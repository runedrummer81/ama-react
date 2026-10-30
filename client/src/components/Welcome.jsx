import { useEffect, useRef, useState } from "react";
import { MAX_LENGTH } from "../constants.js";
import { useTypewriter } from "../hooks/useTypewriter.js";
import SendIcon from "./SendIcon.jsx";

const TYPEWRITER_EXAMPLES = [
  "Hvor bor du?",
  "Hvad kan du?",
  "Hvad laver du i din fritid?",
];

export default function Welcome({
  visible,
  entering,
  exitStage, // null | "sending" | "collapsing" | "flying"
  value,
  onChange,
  onSubmit,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const placeholder = useTypewriter(
    visible && value === "",
    TYPEWRITER_EXAMPLES,
  );

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  const welcomeClass = [
    "welcome",
    !visible && "is-hidden",
    entering && "is-entering",
  ]
    .filter(Boolean)
    .join(" ");

  const panelClass = [
    "welcome-panel",
    exitStage && `is-${exitStage}`,
    focused && "is-active",
  ]
    .filter(Boolean)
    .join(" ");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <div id="welcome" className={welcomeClass}>
      <div className="welcome-frame">
        <div className={panelClass}>
          <div className="panel-tab" aria-hidden="true">
            <span className="panel-tab-dot"></span>
            <span>ONLINE</span>
          </div>
          <h1
            id="welcome-heading"
            className="welcome-heading"
            data-text="RUNE_INDEX"
          >
            RUNE_INDEX
          </h1>

          <form className="chat-input" id="question-form" onSubmit={handleSubmit}>
            <label htmlFor="question">Skriv din besked</label>
            <input
              id="question"
              name="question"
              type="text"
              ref={inputRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              required
              maxLength={MAX_LENGTH}
            />
            <span
              className={`char-counter${value.length >= MAX_LENGTH ? " char-counter--limit" : ""}`}
            >
              {value.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              id="send-btn"
              aria-label="Send"
              disabled={value.length === 0}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

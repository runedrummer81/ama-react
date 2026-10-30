const SUGGESTIONS = [
  "Fortæl om Rune",
  "Hvad er dine hobbyer?",
  "Hvad kan du?",
];

export default function Suggestions({ exiting, hidden, entering, onPick }) {
  const className = [
    "suggestions",
    exiting && "is-exiting",
    hidden && "is-hidden",
    entering && "is-entering",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="input-area">
      <div className={className}>
        {SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="suggestion-chip"
            onClick={() => onPick(label)}
          >
            <span className="chip-label">{label}</span>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`chip-slice chip-slice--${n}`}>
                {label}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

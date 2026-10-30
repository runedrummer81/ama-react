export default function HeroPhoto({ exiting, hidden }) {
  const className = [
    "hero-photo-wrap",
    exiting && "is-exiting",
    hidden && "is-hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <img src="/rune.png" alt="" className="hero-photo" />

      <div className="hero-slice hero-slice--1"></div>
      <div className="hero-slice hero-slice--2"></div>
      <div className="hero-slice hero-slice--3"></div>
      <div className="hero-slice hero-slice--4"></div>

      <div className="hero-rgb hero-rgb--r"></div>
      <div className="hero-rgb hero-rgb--b"></div>

      <div className="hero-photo-tint"></div>
      <div className="hero-idle-static"></div>
      <div className="hero-noise"></div>
    </div>
  );
}

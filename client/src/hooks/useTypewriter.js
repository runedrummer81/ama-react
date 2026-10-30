import { useEffect, useRef, useState } from "react";

const TYPE_SPEED = 55;
const DELETE_SPEED = 30;
const HOLD_MS = 1800;

// Returnerer det placeholder-tekst, der lige nu er "skrevet".
// enabled=false pauser (og tømmer) placeholderen.
export function useTypewriter(enabled, examples) {
  const [placeholder, setPlaceholder] = useState("");
  const progress = useRef({ index: 0, chars: 0, deleting: false });

  useEffect(() => {
    if (!enabled) {
      setPlaceholder("");
      return;
    }

    const p = progress.current;
    let timeout;

    function tick() {
      const current = examples[p.index];

      if (!p.deleting) {
        p.chars = Math.min(p.chars + 1, current.length);
        setPlaceholder(current.slice(0, p.chars));

        if (p.chars === current.length) {
          timeout = setTimeout(() => {
            p.deleting = true;
            tick();
          }, HOLD_MS);
          return;
        }
        timeout = setTimeout(tick, TYPE_SPEED);
      } else {
        p.chars--;
        setPlaceholder(current.slice(0, p.chars));

        if (p.chars === 0) {
          p.deleting = false;
          p.index = (p.index + 1) % examples.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, DELETE_SPEED);
      }
    }

    tick();
    return () => clearTimeout(timeout); // cleanup: aldrig to loops på én gang
  }, [enabled, examples]);

  return placeholder;
}

import { useEffect, useRef, useState } from "react";
import Message from "./Message.jsx";

export default function MessageList({ messages }) {
  const containerRef = useRef(null);
  const previousCount = useRef(0);
  const scrollTimer = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  // Udtoning i top/bund (kun når der er mere at scrolle til)
  function updateScrollFades() {
    const el = containerRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop < maxScroll - 4);
  }

  function handleScroll() {
    updateScrollFades();
    setScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 700);
  }

  // Scroll til bunden, når der kommer nye beskeder. Glidende, hvis der
  // allerede var beskeder (ikke ved første load / første besked).
  useEffect(() => {
    const el = containerRef.current;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: previousCount.current > 0 ? "smooth" : "auto",
    });
    previousCount.current = messages.length;
    updateScrollFades();
  }, [messages.length]);

  const className = [
    "messages-inner",
    canScrollUp && "can-scroll-up",
    canScrollDown && "can-scroll-down",
    scrolling && "is-scrolling",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id="messages-inner"
      className={className}
      ref={containerRef}
      onScroll={handleScroll}
    >
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </div>
  );
}

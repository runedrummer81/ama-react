import { useEffect, useRef, useState } from "react";
import { deleteMessages, getMessages, postQuestion } from "./api.js";
import {
  CHAT_CLOSE_MS,
  CHAT_OPEN_MS,
  EXIT_TIMING,
  WARP_MS,
  WELCOME_ENTER_MS,
  reducedMotion,
} from "./constants.js";
import ChatWindow from "./components/ChatWindow.jsx";
import HeroPhoto from "./components/HeroPhoto.jsx";
import SideImages from "./components/SideImages.jsx";
import Suggestions from "./components/Suggestions.jsx";
import Welcome from "./components/Welcome.jsx";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  // "welcome" = velkomstskærmen, "chat" = chatvinduet. Aldrig begge.
  const [view, setView] = useState("welcome");
  const [messages, setMessages] = useState([]);
  const [welcomeText, setWelcomeText] = useState("");

  // Animationsfaser (erstatter alle classList.add/remove i den gamle app.js)
  const [exitStage, setExitStage] = useState(null); // null | "sending" | "collapsing" | "flying"
  const [chatAnim, setChatAnim] = useState(null); // null | "opening" | "closing"
  const [welcomeEntering, setWelcomeEntering] = useState(false);
  const [heroHidden, setHeroHidden] = useState(false);
  const [warping, setWarping] = useState(false);

  const isResetting = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const isChat = view === "chat";
  const lastAnswer = messages.findLast((m) => m.type === "answer") ?? null;

  // ---------- Opstart ----------

  // bg.js slår #messages op ÉN gang, når den starter. Den skal derfor
  // loades efter Reacts første render, så elementet findes.
  useEffect(() => {
    import("./bg.js").then(() => {
      window.matrixBg?.setChatMode(viewRef.current === "chat");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    getMessages()
      .then((saved) => {
        if (cancelled || saved.length === 0) return;
        setMessages(saved);
        setView("chat");
        setHeroHidden(true);
      })
      .catch((error) => console.error("Kunne ikke hente beskeder:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Effekter der taler med bg.js / <body> ----------

  useEffect(() => {
    window.matrixBg?.setChatMode(isChat);
  }, [isChat]);

  useEffect(() => {
    document.body.classList.toggle("is-warping", warping);
  }, [warping]);

  // ---------- Animationer ----------

  function playWelcomeExit() {
    setExitStage("sending");
    return new Promise((resolve) => {
      setTimeout(() => setExitStage("collapsing"), EXIT_TIMING.collapse);
      setTimeout(() => setExitStage("flying"), EXIT_TIMING.fly);
      setTimeout(resolve, EXIT_TIMING.done);
    });
  }

  // CRT-sluk: vinduet klapper sammen til en streg og forsvinder.
  async function playChatClose() {
    if (reducedMotion.matches) return;
    setChatAnim("closing");
    await wait(CHAT_CLOSE_MS);
  }

  // Velkomstskærmen glitcher ind igen.
  function playWelcomeEnter() {
    if (reducedMotion.matches) return;
    setWelcomeEntering(true);
    setTimeout(() => setWelcomeEntering(false), WELCOME_ENTER_MS);
  }

  // ---------- Send et spørgsmål ----------

  async function sendQuestion(question) {
    const request = postQuestion(question);
    request.catch(() => {}); // fejlen håndteres, når vi await'er nedenfor

    // Allerede inde i en chat: ingen overgang, bare vis svaret.
    if (view === "chat") {
      const data = await request;
      setMessages((prev) => [
        ...prev,
        data.question,
        { ...data.answer, animate: true },
      ]);
      return;
    }

    // Første besked: hele overgangen velkomst -> chat.
    // 1) Hero, chips og panel glitcher/folder/flyver væk.
    await playWelcomeExit();
    const data = await request;

    // 2) Rejse ind i matrixen: zoom + fart op, og tegnene glider derefter
    //    ud af skærmen indtil den er helt tom.
    if (window.matrixBg) {
      setWarping(true);
      await window.matrixBg.warp(WARP_MS);
      setWarping(false);
      await window.matrixBg.drain();
    }

    // 3) Grid-gulvet glider op fra bunden.
    if (window.gridFloor) {
      await window.gridFloor.rise();
    }

    // 4) Chatvinduet folder sig åbent nedefra, oven på gulvet.
    setView("chat");
    setChatAnim("opening");
    setMessages([data.question, { ...data.answer, animate: true }]);
    setTimeout(() => setChatAnim(null), CHAT_OPEN_MS);
  }

  async function handleWelcomeSubmit(text) {
    const question = text.trim();
    if (!question || exitStage !== null) return; // ignorér dobbelt-send

    try {
      await sendQuestion(question);
      setWelcomeText("");
    } catch (error) {
      console.error("Kunne ikke sende spørgsmålet:", error);
      // Tilbage til velkomstskærmen, så man kan prøve igen
      setExitStage(null);
      setWarping(false);
    }
  }

  async function handleChatSend(question) {
    try {
      await sendQuestion(question);
    } catch (error) {
      console.error("Kunne ikke sende spørgsmålet:", error);
    }
  }

  // Klik på et forslag = samme flow som at skrive spørgsmålet og trykke send.
  function handleChipPick(label) {
    if (exitStage !== null) return;
    setWelcomeText(label);
    handleWelcomeSubmit(label);
  }

  // ---------- Ny chat ----------

  async function handleNewChat() {
    if (isResetting.current) return; // ignorér dobbeltklik midt i animationen
    isResetting.current = true;

    try {
      const deleting = deleteMessages();

      // 1) Chatvinduet slukker.
      await playChatClose();
      await deleting;

      // 2) Ryd op og vis velkomstskærmen igen.
      setMessages([]);
      setView("welcome");
      setChatAnim(null);
      setExitStage(null);
      setHeroHidden(false);
      setWelcomeText("");
      window.gridFloor?.reset();
      window.matrixBg?.resumeSpawning();

      // 3) Velkomsten glitcher ind.
      playWelcomeEnter();
    } catch (error) {
      console.error("Kunne ikke starte en ny chat:", error);
      setChatAnim(null);
    } finally {
      isResetting.current = false;
    }
  }

  return (
    <>
      <HeroPhoto exiting={exitStage !== null} hidden={heroHidden} />

      <main>
        <section
          className={`chat${isChat ? "" : " is-welcome"}`}
          aria-label="Chatbot"
        >
          <Welcome
            visible={!isChat}
            entering={welcomeEntering}
            exitStage={exitStage}
            value={welcomeText}
            onChange={setWelcomeText}
            onSubmit={handleWelcomeSubmit}
          />

          <ChatWindow
            visible={isChat}
            anim={chatAnim}
            messages={messages}
            onSend={handleChatSend}
            onNewChat={handleNewChat}
          />

          <Suggestions
            exiting={exitStage !== null}
            hidden={isChat}
            entering={welcomeEntering}
            onPick={handleChipPick}
          />
        </section>
      </main>

      <footer>
        <p>Lavet af Rune</p>
      </footer>

      {/* Billederne glitcher væk, mens chatten slukker */}
      <SideImages answer={chatAnim === "closing" ? null : lastAnswer} />
    </>
  );
}

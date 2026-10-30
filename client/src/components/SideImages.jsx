import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "../constants.js";

const SIDE_IMAGE_MIN_SPACE = 150; // px whitespace pr. side, før der er plads
const SIDE_IMAGE_MAX_WIDTH = 440; // px, størst mulige bredde
const SIDE_IMAGE_MAX_HEIGHT = 0.55; // størst mulige højde (andel af vinduet)
const SIDE_IMAGE_LEAVE_MS = 450; // skal matche sideOut i styles.css
const SIDE_IMAGE_MIN_TOP = 90; // px, under knapperne øverst til højre
const SIDE_IMAGE_GAP = 20; // px mellem to billeder oven på hinanden
const SIDE_IMAGE_FLOOR_MARGIN = 20; // px luft over grid-gulvet

const LAYERS = [
  "side-image__tint",
  "side-image__slice side-image__slice--1",
  "side-image__slice side-image__slice--2",
  "side-image__slice side-image__slice--3",
  "side-image__slice side-image__slice--4",
  "side-image__rgb side-image__rgb--r",
  "side-image__rgb side-image__rgb--b",
  "side-image__noise",
];

let nextFigureId = 0;

function getSideSpace() {
  const chat = document.querySelector(".chat");
  return (window.innerWidth - chat.getBoundingClientRect().width) / 2;
}

// Nederste grænse for billederne: lige over grid-gulvets horisontlinje.
function getImageAreaBottom() {
  const floor = document.getElementById("grid-floor");
  const floorHeight = floor?.offsetHeight || window.innerHeight * 0.25;
  return window.innerHeight - floorHeight - SIDE_IMAGE_FLOOR_MARGIN;
}

// image = ét billede eller en liste. Vi vælger højst 2 tilfældige.
//   { src: "img/svartsot.jpg", alt: "Svartsot på scenen", scale: 1 }
function pickImages(images) {
  const list = (Array.isArray(images) ? images : [images]).filter(
    (image) => image?.src,
  );
  // Fjern dubletter (samme src)
  const unique = [...new Map(list.map((image) => [image.src, image])).values()];
  return unique.sort(() => Math.random() - 0.5).slice(0, 2);
}

// Henter billedet først, så vi kender formatet (stående/liggende/kvadratisk).
function loadImage(image) {
  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img), { once: true });
    img.addEventListener("error", () => resolve(null), { once: true });
    img.src = image.src;
  });
}

// `answer` = seneste svar (eller null). Billederne hører til emnet (kategorien):
// - samme emne som sidst -> billederne bliver stående
// - nyt emne -> de gamle glitcher væk, og (hvis emnet har billeder) spawner
//   der nye, når de gamle er væk, så de aldrig ligger oven på hinanden.
export default function SideImages({ answer }) {
  const [figures, setFigures] = useState([]);
  const figuresRef = useRef([]); // seneste figures, til brug i effekter/timere
  const categoryRef = useRef(null); // hvilket emne billederne hører til
  const tokenRef = useRef(0); // så et forsinket spawn kan aflyses
  const nextSideRef = useRef("left"); // billederne skifter side fra emne til emne

  useEffect(() => {
    figuresRef.current = figures;
  }, [figures]);

  function clearImages() {
    tokenRef.current++;
    categoryRef.current = null;

    const ids = figuresRef.current.filter((f) => !f.leaving).map((f) => f.id);
    if (ids.length === 0) return;

    setFigures((prev) =>
      prev.map((f) => (ids.includes(f.id) ? { ...f, leaving: true } : f)),
    );
    setTimeout(
      () => setFigures((prev) => prev.filter((f) => !ids.includes(f.id))),
      reducedMotion.matches ? 0 : SIDE_IMAGE_LEAVE_MS,
    );
  }

  async function spawnImages(images, token) {
    const space = getSideSpace();
    if (space < SIDE_IMAGE_MIN_SPACE) return; // for smalt: skip

    const loaded = await Promise.all(images.map(loadImage));
    if (token !== tokenRef.current) return; // emnet nåede at skifte

    // Kun de billeder, der faktisk blev hentet.
    const items = images
      .map((image, index) => ({ image, img: loaded[index] }))
      .filter((item) => item.img);
    if (items.length === 0) return;

    // Alle billederne står i samme side, oven på hinanden.
    const side = nextSideRef.current;
    nextSideRef.current = side === "left" ? "right" : "left";

    const top = SIDE_IMAGE_MIN_TOP;
    const bottom = Math.max(getImageAreaBottom(), top + 100);
    const areaHeight = bottom - top;

    // Hvert billede må højst fylde sin del af højden (og ikke blive for bredt).
    const maxHeight =
      items.length === 1
        ? Math.min(window.innerHeight * SIDE_IMAGE_MAX_HEIGHT, areaHeight)
        : (areaHeight - SIDE_IMAGE_GAP * (items.length - 1)) / items.length;
    const maxWidth = Math.min(space - 24, SIDE_IMAGE_MAX_WIDTH);

    for (const item of items) {
      const aspect = item.img.naturalWidth / item.img.naturalHeight || 1;
      item.width = Math.min(
        Math.min(maxWidth, maxHeight * aspect) * (item.image.scale ?? 1),
        space - 24,
      );
      item.height = item.width / aspect;
    }

    // Stakken centreres lodret midt for chatvinduet, men holdes over gulvet.
    const stackHeight =
      items.reduce((sum, item) => sum + item.height, 0) +
      SIDE_IMAGE_GAP * (items.length - 1);
    const chatRect = document.querySelector(".chat").getBoundingClientRect();
    let y = Math.min(
      Math.max(chatRect.top + (chatRect.height - stackHeight) / 2, top),
      bottom - stackHeight,
    );

    const newFigures = items.map((item) => {
      const figure = {
        id: nextFigureId++,
        src: item.image.src,
        alt: item.image.alt ?? "",
        side,
        width: item.width,
        offset: (space - item.width) / 2, // centreret i whitespace
        top: y,
        glitchDelay: -Number((Math.random() * 6).toFixed(1)), // ikke synkront
      };
      y += item.height + SIDE_IMAGE_GAP;
      return figure;
    });

    setFigures((prev) => [...prev, ...newFigures]);
  }

  useEffect(() => {
    if (!answer) {
      clearImages();
      return;
    }
    if (answer.category === categoryRef.current) return;

    const hadImages = figuresRef.current.some((f) => !f.leaving);
    clearImages();
    categoryRef.current = answer.category;

    const images = pickImages(answer.image);
    if (images.length === 0) return;

    const token = tokenRef.current;
    const wait = hadImages && !reducedMotion.matches ? SIDE_IMAGE_LEAVE_MS : 0;
    setTimeout(() => spawnImages(images, token), wait);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  return figures.map((figure) => (
    <figure
      key={figure.id}
      className={`side-image side-image--${figure.side}${figure.leaving ? " is-leaving" : ""}`}
      style={{
        "--img": `url("${figure.src}")`,
        "--w": `${figure.width}px`,
        "--offset": `${figure.offset}px`,
        "--top": `${figure.top}px`,
        "--tilt": "0deg", // billederne står lige
        "--gd": `${figure.glitchDelay}s`,
      }}
    >
      <img className="side-image__img" src={figure.src} alt={figure.alt} />
      {LAYERS.map((layerClass) => (
        <div key={layerClass} className={layerClass}></div>
      ))}
    </figure>
  ));
}

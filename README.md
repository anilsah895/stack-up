# Stack-Up

> A fast-paced, minimalist HTML5 tower-stacking game built for YouTube Playables and web browsers.

🌐 **Live Demo**: [https://anilsah895.github.io/stack-up/](https://anilsah895.github.io/stack-up/)

---

## 🎮 About

**Stack-Up** is an addictive precision-timing block-stacking game. Moving blocks slide back and forth across the screen; your goal is to drop each block precisely on top of the stack below. Overhanging sections are sliced off, making subsequent blocks smaller and testing your timing as the tower ascends into the sky.

---

## 🕹️ How to Play

- **Objective**: Stack moving blocks as high as possible without missing the platform.
- **Controls**:
  - **Touch / Tap**: Tap anywhere on the screen or canvas.
  - **Mouse**: Click anywhere on the game canvas.
  - **Keyboard**: Press `Space` or `Enter` to drop the active block.
- **Mechanics**:
  - **Timing**: Drop blocks cleanly over the block beneath.
  - **Trimming**: Any part of the block hanging off the edge is chopped off and falls as physics debris.
  - **Perfect Alignment**: Aligning a block within a 5px tolerance triggers a **Perfect** drop, expanding rings, and sound effects.
  - **Combos**: Achieve 3+ consecutive perfect drops to widen your active block up to its base width.
  - **Game Over**: Missing the stack entirely collapses the tower.

---

## ✨ Features

- **Physics & Trimming**: Real-time slicing of blocks into falling debris pieces.
- **Dynamic Combo System**: Rewards precision timing with block expansion and pitch-escalating combo tones.
- **Procedural Sky & Background**: Multi-layer gradient background with stars and parallax mountain ridges that transition as your tower grows taller.
- **High Score System**: Automatic persistence via YouTube Playables SDK (`saveData`/`loadData`) inside YouTube, with seamless `localStorage` fallback on standard web pages.
- **Responsive Canvas**: Auto-scaling vector layout with Device Pixel Ratio (DPR) optimization for high-density displays.
- **Accessibility & Motion Controls**: Respects `prefers-reduced-motion` for smooth visual accommodations.
- **Zero External Assets**: Pure HTML5 Canvas & Web Audio API synthesizer for sub-millisecond load times.

---

## 🔊 Audio

Stack-Up features a custom procedural **Web Audio API** sound engine with zero external audio assets:
- **Audio Context Management**: `AudioContext` is instantiated lazily on the first user interaction (`pointerdown` / `keydown`) for strict browser autoplay compliance.
- **Sound Effects**:
  - *Start / Restart*: `520 Hz` triangle wave chime.
  - *Standard Drop*: `260 Hz` square wave placement thump.
  - *Perfect Drop*: Pitch-scaling triangle wave (`520 Hz + combo * 70 Hz`).
  - *Tower Collapse*: Downward pitch-swept sawtooth wave (`150 Hz` → `60 Hz`).
  - *New High Score*: 3-note ascending fanfare (`520 Hz` → `650 Hz` → `780 Hz`).
- **Mute Sync**: Synchronizes seamlessly with YouTube Playables system audio preferences (`isAudioEnabled` / `onAudioEnabledChange`).

---

## 📱 Platform

Built as an **HTML5 Playable Game** tailored for **YouTube Playables** and standard desktop/mobile web browsers.

> *Note: Designed in accordance with YouTube Playables technical guidelines. This project is independently developed and is not officially endorsed or certified by YouTube.*

---

## 🧩 Technology

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure & canvas viewport setup |
| **CSS3** | Full-screen responsive viewport layout & touch-action handling |
| **JavaScript (ES5/ES6)** | Single-file procedural game loop, canvas rendering, & state logic |
| **HTML5 Canvas API** | Hardware-accelerated 2D graphics, dynamic lighting, & parallax rendering |
| **Web Audio API** | Procedural sound synthesizer (oscillators & gain nodes) |
| **YouTube Playables SDK** | Lifecycle callbacks (`onPause`, `onResume`), score tracking, cloud saves, & audio sync |

---

## ▶️ Run Locally

Serve the repository root using any standard HTTP server (do not open directly via `file://` to allow proper script loading):

```bash
python -m http.server 8080
```

Then open your browser and navigate to:
```
http://localhost:8080/
```

---

## 📁 Project Structure

```
stack-up-playable/
├── index.html     # HTML entry point with canvas setup & SDK loader
├── style.css      # Fullscreen reset & layout stylesheet
├── game.js        # Core game logic, canvas renderer, Web Audio synth, & Playables SDK integration
└── README.md      # Project documentation
```

---

## ▶️ YouTube Playables SDK Integration

The game integrates the YouTube Playables SDK (`ytgame`) for complete platform compatibility:

- **Lifecycle Management**: Listens to `onPause` and `onResume` to freeze/resume game loops and audio.
- **Audio Sync**: Respects `isAudioEnabled()` and `onAudioEnabledChange()`.
- **Score & Progress**: Calls `sendScore()` on game completion and uses `loadData()` / `saveData()` for high score persistence.
- **Readiness Flow**: Signals `firstFrameReady()` on the initial frame and `gameReady()` when data is initialized.

To test Playables integration, use the official Google [SDK Test Suite](https://developers.google.com/youtube/gaming/playables/certification/sdktestsuite).

---

## 🛡️ Originality & Assets

- **Source Code**: 100% original, lightweight JavaScript implementation.
- **Visuals**: Dynamically rendered 2D HTML5 canvas graphics and color palettes.
- **Audio**: 100% synthetic sound generation via Web Audio API oscillators — zero external copyrighted audio files used.

---

## 📜 License

No open-source license is currently specified for this repository. All rights reserved by the developer.

---

## 📌 Development Status

**Playable Prototype / Ready for YouTube Playables SDK Validation** — Fully functional across desktop and mobile devices.

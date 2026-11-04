# typing-monster

English | [中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Any%20browser-blue)](#)
[![Zero deps](https://img.shields.io/badge/deps-zero-brightgreen.svg)](#)

> Teach your kid to touch-type by feeding letters to a hungry little monster.

A zero-dependency, offline, single-file typing tutor for ages 5–8. The pink monster "Mei Mei" is hungry — type the letter floating above her head correctly, she eats it, grows up, and earns new skins. No install, no build, no account, no internet required.

## ✨ Features

- 🎯 **Structured 6-stage curriculum, 29 levels** — home row → top row → bottom row → English words → Pinyin/Chinese characters → short English sentences. The proven touch-type path, never dumps all 26 keys at once.
- 🔊 **Speaks every letter / word out loud** — uses the browser's built-in Web Speech API; auto-switches between English (en-US) and Chinese (zh-CN). No audio files to ship.
- 🎨 **Cutepink mascot with growth system** — inline SVG monster with 4 evolution forms (baby → berry → crowned → winged), 4 unlockable skins, random sticker-sticker surprises after levels.
- 📊 **Parent dashboard** — progress per stage, star counts, practice heat-map showing which keys are hit wrong most often, daily goal tracking.
- 🛡️ **Kid-friendly by design** — no game-over, no score loss, wrong keypress just wiggles the key. 15-minute eye-care break reminder. Daily goal (default 10 min) actively tells the kid "you're full, go play".
- 💾 **Offline progress** — localStorage with auto-backup, export/import JSON, optional auto-save to a local folder (Chrome/Edge).
- 📱 **Touch-friendly** — iPad / tablet users can tap the on-screen keyboard; desktop still requires a physical keyboard (no fake mouse-typing practice).

## Quick start

Just open `index.html` in any modern browser. That's it.

### Optional: local server (recommended for iPad)

```bash
# Windows: double-click start.bat
# macOS / Linux:
python3 -m http.server 8321
# then open http://127.0.0.1:8321
```

To play on an iPad / tablet on the same Wi-Fi (Windows): double-click `start-ipad.bat`, then open the printed `http://<your-ip>:8321` on the tablet's Safari.

## Curriculum

| Stage | Content | Levels |
|---|---|---|
| 1 | Home row (A S D F J K L ;) | 8 |
| 2 | Top row (Q W E R T Y U I O P) | 4 |
| 3 | Bottom row (Z X C V B N M , . /) | 4 |
| 4 | English words (cat / dog / sun …) | 5 |
| 5 | Pinyin & Chinese characters | 5 |
| 6 | Short English sentences | 3 |

Each level has 6–20 targets, takes 2–3 minutes. Three stars per level: finish ⭐, ≥80% accuracy ⭐⭐, ≥80% and ≤6s per target ⭐⭐⭐.

## Tech stack

Plain HTML / CSS / vanilla JS. No frameworks, no bundler, no npm install.
- Speech: Web Speech API
- Sound: Web Audio API (synthesized live, no audio files)
- Progress: localStorage
- Mascot: inline SVG (no image assets, no copyright risk)

## Test

```bash
# e2e tests need Playwright + a local server running
node tests/e2e.js
```

## Keywords

typing game for kids, touch typing tutor, keyboard learning for children, typing practice, phonics typing, pinyin typing, kids educational game, offline typing game, html typing game, no-deps, 儿童打字游戏, 键盘启蒙, 打字练习, 拼音打字, 英语单词打字

## License

[MIT](LICENSE)

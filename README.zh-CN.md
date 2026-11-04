# typing-monster（打字小怪兽）

[English](README.md) | 中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Any%20browser-blue)](#)
[![Zero deps](https://img.shields.io/badge/deps-zero-brightgreen.svg)](#)

> 喂字母给饿肚子的小怪兽，顺便学会打字。

一个给 5–8 岁孩子的键盘启蒙打字游戏。纯静态网页，零依赖、零构建、离线可玩。粉色小怪兽「莓莓」饿了，孩子按对它想吃的字母，它就吃掉、长大、进化、换皮肤。不用装软件、不用注册账号、不用联网。

## ✨ 核心功能

- 🎯 **六阶段课程体系，共 29 关** —— 主键区 → 上排 → 下排 → 英文单词 → 拼音汉字 → 英文短句。业界公认的从内到外路径，一上来不把 26 个键全扔给孩子。
- 🔊 **字母/单词自动发音** —— 用浏览器自带的 Web Speech API，英文用 en-US、中文用 zh-CN，自动切换。不用录任何音频文件。
- 🎨 **小怪兽养成系统** —— 内联 SVG 主角「莓莓」，4 种进化形态（宝宝 → 莓莓 → 星冠 → 星翼），4 套皮肤按星星数解锁，过关还会随机掉贴纸彩蛋。
- 📊 **家长统计页** —— 各阶段进度、累计星星、练习天数、**键位热力图**（错得越多颜色越深，一眼看出哪个键是短板）、每日目标。
- 🛡️ **儿童友好设计** —— 不扣分、不 Game Over、按错只是按键抖一下；15 分钟护眼提醒；每日目标默认 10 分钟，达成后小怪兽主动劝"吃饱啦去玩吧"。
- 💾 **离线存档** —— localStorage 自动双写备份，支持导出/导入 JSON，桌面 Chrome/Edge 还能授权文件夹自动落盘。
- 📱 **触屏可用** —— iPad / 平板上可以直接点屏幕键盘；电脑端只认物理键盘（防止用鼠标点键冒充打字）。

## 快速开始

直接用浏览器打开 `index.html` 就能玩。

### 可选：本地服务（iPad 推荐）

```bash
# Windows：双击 start.bat
# macOS / Linux：
python3 -m http.server 8321
# 然后访问 http://127.0.0.1:8321
```

iPad / 平板跟电脑连同一个 WiFi 时（Windows）：双击 `start-ipad.bat`，在平板 Safari 里打开窗口里打印的 `http://<电脑IP>:8321`。

## 课程体系

| 阶段 | 内容 | 关卡数 |
|---|---|---|
| 一 | 主键区（A S D F J K L ;） | 8 |
| 二 | 上排（Q W E R T Y U I O P） | 4 |
| 三 | 下排（Z X C V B N M , . /） | 4 |
| 四 | 英文单词（cat / dog / sun …） | 5 |
| 五 | 拼音汉字（看汉字打拼音） | 5 |
| 六 | 英文短句 | 3 |

每关 6–20 个目标，2–3 分钟打完。每关最多 3 星：完成 ⭐、准确率 ≥80% ⭐⭐、准确率 ≥80% 且平均每目标 6 秒内 ⭐⭐⭐。

## 技术栈

原生 HTML / CSS / 原生 JS。无框架、无打包、不用 npm install。
- 发音：Web Speech API
- 音效：Web Audio API 现场合成（不存音频文件）
- 进度：localStorage
- 主角：内联 SVG（不依赖图片资源，无版权风险）

## 测试

```bash
# e2e 测试需要先起本地服务，并装 Playwright
node tests/e2e.js
```

## 关键词

儿童打字游戏、键盘启蒙、打字练习、拼音打字、英语单词、少儿编程启蒙、离线网页游戏、HTML5 游戏、touch typing for kids、typing tutor、kids educational game、phonics、pinyin、no-deps

## 开源协议

[MIT](LICENSE)

# AGENTS.md · 打字小怪兽项目现状交接

> 给后续接手的大模型/开发者：**先读本文件，再读 `DESIGN.md`（设计唯一真源），最后按需读 `README.md`（使用者手册）**。
> 本文件描述的是「代码现状 + 踩过的坑 + 验收纪律」，与 DESIGN.md 的设计决策互为补充。

## 1. 项目是什么

给 8 岁零基础女孩的键盘打字启蒙游戏，纯静态单页应用，零依赖零构建零联网。
主角是粉色小怪兽「莓莓」，六阶段课程共 **29 关**（主键区 8 → 上排 4 → 下排 4 → 英文单词 5 → 拼音汉字 5 → 英文短句 3）。
昕主（项目所有者）分步骤提需求，**每次只解决一个问题**，改完必须验证再交付。

## 2. 文件职责（改哪里）

| 文件 | 行数 | 职责 | 改动频率 |
|---|---|---|---|
| `index.html` | ~290 | 全部页面结构：菜单屏/游戏屏/结算屏 + 5 个弹窗（统计/存档/图鉴/进化/护眼） | 低 |
| `style.css` | ~800 | 粉色马卡龙风格 + 全部动画，CSS 变量集中管理皮肤 | 高 |
| `levels.js` | ~120 | **关卡数据**（`LEVELS.stages[].levels[]`），加关调序只改这里 | 中 |
| `game.js` | ~1280 | 全部逻辑（IIFE 单文件，无模块化） | 高 |
| `start.bat` | — | 一键启动（起 http.server 8321 绑 127.0.0.1 + 开浏览器） | 低 |
| `start-ipad.bat` | — | iPad/平板启动（跑 serve.py，绑 0.0.0.0 并打印局域网地址） | 低 |
| `serve.py` | — | 局域网静态服务，启动时打印「平板上玩：http://<LAN IP>:8321」 | 低 |
| `tests/e2e.js` | — | Playwright e2e，**116 项断言**，改完必须全过 | 中 |
| `DESIGN.md` | — | 设计唯一真源 + 执行台账（每个功能/每个 bug/每条教训都在里面） | 每次改动追加 |
| `AGENTS.md` | — | 本文件，项目现状交接 | 架构变化时更新 |

## 3. 运行与测试

```bash
# 运行（日常）：双击 start.bat，访问 http://127.0.0.1:8321
# 运行（iPad）：双击 start-ipad.bat，按窗口里打印的 http://<LAN IP>:8321 在 iPad Safari 打开
#   ⚠️ start.bat 是 --bind 127.0.0.1，局域网设备访问不到；要跨设备必须用 start-ipad.bat
#   触摸设备（iPad/平板）可直接点虚拟键盘作答；电脑无触摸屏时仍只认物理键盘（见 §5 inputChar）
# 测试（改动后必跑）：
cd D:/claude-code/my-claude-project/typing-monster
node --check game.js
NODE_PATH="C:/Users/chenm/.workbuddy/binaries/node/workspace/node_modules" \
  "C:/Users/chenm/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" tests/e2e.js
```
要求：`node --check` 通过 + **116 项断言全过**。测试用真实 Chrome（`C:/Users/chenm/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe`）+ 真实键盘事件。
测试盲区（需人体验证）：语音内容与发音时序、Web Audio 实际播放、自动存档写文件全流程、动画流畅度、三星速度标准松紧。

## 4. 数据结构（localStorage，改 store 结构必读）

- 主 key：`typing-monster-progress-v1`；备份 key：`typing-monster-progress-v1-backup`（每次存档双写）
- 结构：`{ progress, daily, heat, stickers, growth, settings }`
  - `progress`: `{ "1-1": {stars, best}, ... }`（按关卡 id 存星级）
  - `daily`: `{ "2026-10-20": {seconds, levels} }`
  - `heat`: `{ "f": {ok, bad}, ... }`（键位热力图，handleCorrect/handleWrong 实时记）
  - `stickers`: `{ "🍓": 1, ... }`（图鉴收集）
  - `growth`: `{ celebrated: N }`（防进化弹窗重复弹出）
  - `settings`: `{ sound, eyeMinutes, dailyMinutes, skin }`
- **铁律**：`parseStore()` 必须对旧存档兼容（新字段缺省自动补），昕主的真实进度不能因加字段而丢。e2e 有「旧存档兼容」专项断言守着。
- 存档四层保险：双写备份 / 损坏自动恢复并回写 / File System Access API 自动存档到文件夹（progress.json + 5 份滚动快照）/ 手动导出导入 json。

## 5. game.js 关键函数地图

- 输入入口：`inputChar(ch)` 是唯一判定入口——物理键盘走 `onKeyDown`，触摸设备走 `.key` 的 `pointerdown`（`touchTyping` 用 `(any-pointer: coarse)` 判定，电脑端不注册，防止鼠标点键冒充打字）
- 关卡流：`buildQueue(level)`（三种模式：单键 `keys`+`count` / 单词 `words` / 汉字 `hanzi`）→ `startLevel(id)` → `renderTarget()` → `onKeyDown()` → `handleCorrect()/handleWrong()` → `finishLevel()`
- 序列目标（阶段四五六）：`targets[]` 拆字符逐个击破，`cIdx` 定位当前字符，**目标内按错只重按当前字母，已按对的不清**
- 语音：`speakLetter(ch, force)`，字母/单词 en-US、汉字 zh-CN；280ms 确认语音 + 700ms 预读语音，`force` 参数绕过节流（防「按 F 发音是 S」类 bug，别动这两段时序）
- 界面渲染：`renderMenu()` / `renderStarsBadge()` / `renderGrowthBar()` / `renderSkinPicker()` / `renderStickerBook()` / `renderStats()` / `renderDailyGoal()`
- 养成线：`growthStage(stars)` 四形态（0★宝宝/10★莓莓/25★星冠/45★星翼）→ `checkEvolution()` → `showEvolutionModal()`；皮肤 `SKINS` 数组按星数解锁
- 存档：`saveStore()` 是唯一写入口，**任何状态变化都走它**，不要单独 localStorage.setItem

## 6. 当前 UI 结构（2026-10-20 二次精修后）

- **设计令牌**：`style.css` 顶部 `:root` 是唯一色板与圆角/阴影来源。圆角三档：`--r-xs 8px`（徽章、出发按钮）、`--r-md 14px`（卡片、工具坞、皮肤卡、每日目标）、`--r-lg 18px`（阶段区块、游戏舞台）。不要随手写 999px 胶囊或 20/24/16 混用；进度条轨道除外
- **菜单屏顶部**：`.top-nav` 是 `grid-template-columns: 1fr auto 1fr`
  - 左：莓莓 SVG 头像 38px（皮肤变量锁死草莓粉，不随皮肤变）+ 21px 标题
  - 中：`.nav-tools` 一个白色胶囊容器（14px 圆角 / 1px 浅边 / 细阴影），内部四个 `.tool-btn` 无边框，靠 `.tool-btn + .tool-btn::before` 细分隔线分区；音效用 `.tool-switch` 拨钮表达开关（`.off` 类 + `aria-pressed`，由 `syncSoundBtn()` 统一同步，禁止再往文字里拼「开/关」）
  - 右：`.stars-badge` 粉底两行卡——`#stars-count` 17px 为主，`#stars-progress` 9.5px 为辅
  - ≤680px：工具坞换到第二行居中；420px 以下再收内距。任何宽度都不允许溢出/重叠（已验证 375/420/640/680/760/820/1024/1280/1440）
- **第二行**：副标题居中 12.5px → 今日目标通栏卡（label + 6px 细进度条 + 右侧 `#daily-goal-pct` 百分比；达成时 label 变粉、圆环转薄荷绿、右侧显示「达成」）。`#daily-goal-text` 的文案格式被 e2e 断言锁死（`今日目标 N / M 分钟`），别改
- **角色区**：mini 莓莓 88px → 成长卡 252px（名号 + 7px 进度条 + 进化提示）→ 四个皮肤卡（选中态粉边 + 外圈光晕，未解锁灰化但仍可读、可点击提示差多少星）
- **地图**：六阶段 stage-block，关卡卡 14px 圆角 1px 浅边，偶数节点下沉 12px + 虚线连接，完成插 🚩 转薄荷绿，当前关白底粉边呼吸 + 「▶ 出发」，未解锁奶油底、文字 #B79F95（不用 opacity 整体变淡，否则读不清）
- **游戏屏**：`#screen-game.active` 是 flex 列 + `min-height: calc(100dvh - 54px)`，`.stage-area` 用 `flex:1` 吃掉剩余高度并垂直居中内容，键盘自然贴底（改高度相关样式前先确认这三条）
  - 大目标 + 手指提示（块级居中、必须在字母下方，别改回 inline-block）+ 莓莓 + +10 飘字 + combo 徽章（存活 1.2s）+ 底部虚拟键盘
  - 键帽 `.key.target` 上方只有一个小圆点指针（`.bubble`，8px + 三角），**不要再往里塞手指文案**——文案在 `#finger-hint` 一处，气泡塞字会压住上一排按键
  - 按对的反馈在 `@keyframes keyFlash` 里（下沉 2px + 回弹），别只改背景色
- **弹窗**：`.modal` / `.overlay` 都是 `align-items:flex-start` + `overflow-y:auto`，卡片靠 `margin:auto` 居中——**换成 `align-items:center` 会让高内容滚不回顶部**（曾经统计弹窗顶被切掉 46px）。卡片统一 `--r-lg` 圆角 + 1px `--line` 描边 + `0 18px 46px` 投影
- **按钮**：`.btn` 是 `padding:10px 18px`（不是 `10px 0`，曾经独立使用时被 999px 胶囊夹变形）；单独出现的按钮靠 `.modal-card > .btn { width:100% }` 撑满
- **结算屏**：`.overlay.active { display: flex }` 才生效——`.screen.active{display:block}` 会压掉 `.overlay` 的 flex，改这两个类前先算特异性
- **地图导航**：29 关滚远后右下角出现 `#btn-jump`「回到当前关」，触发条件是当前关卡片 `getBoundingClientRect().bottom < 60`，靠 scroll/resize 监听 + `renderMenu()` 末尾刷新

## 7. 昕主的偏好与协作方式

- 中文输出；喜欢结构化（对比表、明确的 pass/fail）；直截了当，能区分「必须做」与「可延后」并说清风险
- 视觉审美：**可爱女孩风**（草莓粉/蝴蝶结/腮红/马卡龙奶油），讨厌暗夜风、讨厌大而丑的控件、讨厌多余的框
- 提需求习惯：分步骤、每次只聚焦一个问题；不满意会直接截图 + 一句话反馈（如「这几个按钮改成胶囊形啊」）
- 验收标准：不接受「测试全过」当交付，视觉改动必须截图 + 实测数据

## 8. 血泪教训（硬性规则，违反=返工）

1. **所有 inline SVG 必须显式 width/height 属性 + CSS 双保险**——无尺寸 SVG 在 flex 容器里会被拉伸到占满屏幕（真实事故）
2. **CSS 改完必须 grep 检查重复定义**——后者覆盖前者，曾因漏删旧块让昕主反复看旧样式
3. **视觉验收 = Playwright 截图 + getBoundingClientRect 报关键元素数值**——肉眼会骗人，无头环境也会骗人（截图正常但真实屏幕爆炸的事故）
4. 语音确认/预读的时序（280ms/700ms）和 `force` 参数是修出来的，别随手改
5. combo 徽章显示后必须设 1.2s 定时隐藏，且 startLevel/handleWrong 要清定时器
6. 手指提示气泡：`clearKeyMarks()` 既要移除 class 也要移除 DOM 子节点，否则堆积
7. 活跃时长（每日目标）只统计按键间隔 ≤10s 的部分，防挂机；gapSum 单位是**秒**，别再除 1000
8. 星级标准（昕主嫌高已放宽两轮，别再调高）：1★ 完成；2★ 准确率 ≥80%；3★ 准确率 ≥80% 且平均每目标 ≤6s（速度只算活跃输入间隔）

## 9. 待办 / 二期候选

- 「自由音乐会」（自由按键发声模式）：键盘小岛参考站的四号玩法，昕主未拍板，列为二期候选
- 无其他待办；一期到三期规划内容已全部交付

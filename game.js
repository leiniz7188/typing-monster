/* 打字小怪兽 · 莓莓学键盘 —— 核心逻辑（五阶段版） */
(function () {
  'use strict';

  /* ---------- 静态数据 ---------- */
  var KEY_FINGER = {
    a: '左手小指', s: '左手无名指', d: '左手中指', f: '左手食指', g: '左手食指',
    h: '右手食指', j: '右手食指', k: '右手中指', l: '右手无名指', ';': '右手小指',
    q: '左手小指', w: '左手无名指', e: '左手中指', r: '左手食指', t: '左手食指',
    y: '右手食指', u: '右手食指', i: '右手中指', o: '右手无名指', p: '右手小指',
    z: '左手小指', x: '左手无名指', c: '左手中指', v: '左手食指', b: '左手食指',
    n: '右手食指', m: '右手食指', ',': '右手中指', '.': '右手无名指', '/': '右手小指',
    ' ': '右手大拇指'
  };

  var KEY_ROWS = [
    [['`', 1, '`'], ['1', 1, '1'], ['2', 1, '2'], ['3', 1, '3'], ['4', 1, '4'], ['5', 1, '5'],
     ['6', 1, '6'], ['7', 1, '7'], ['8', 1, '8'], ['9', 1, '9'], ['0', 1, '0'], ['-', 1, '-'],
     ['=', 1, '='], ['退格', 1.6, 'backspace']],
    [['Tab', 1.5, 'tab'], ['Q', 1, 'q'], ['W', 1, 'w'], ['E', 1, 'e'], ['R', 1, 'r'], ['T', 1, 't'],
     ['Y', 1, 'y'], ['U', 1, 'u'], ['I', 1, 'i'], ['O', 1, 'o'], ['P', 1, 'p'], ['[', 1, '['],
     [']', 1, ']'], ['\\', 1, '\\']],
    [['Caps', 1.8, 'capslock'], ['A', 1, 'a'], ['S', 1, 's'], ['D', 1, 'd'], ['F', 1, 'f'],
     ['G', 1, 'g'], ['H', 1, 'h'], ['J', 1, 'j'], ['K', 1, 'k'], ['L', 1, 'l'], [';', 1, ';'],
     ['\'', 1, '\''], ['回车', 2.2, 'enter']],
    [['Shift', 2.4, 'shift'], ['Z', 1, 'z'], ['X', 1, 'x'], ['C', 1, 'c'], ['V', 1, 'v'],
     ['B', 1, 'b'], ['N', 1, 'n'], ['M', 1, 'm'], [',', 1, ','], ['.', 1, '.'], ['/', 1, '/'],
     ['Shift', 2.4, 'shift']],
    [['空格', 7, 'space']]
  ];
  var HOME_KEYS = ['f', 'j'];
  var IGNORE_KEYS = ['tab', 'enter', 'capslock', 'shift', 'escape', 'backspace', 'arrowup',
    'arrowdown', 'arrowleft', 'arrowright', 'control', 'alt', 'meta', 'dead'];

  /* 图标统一走内联 SVG（尺寸必须显式写在标签上，见 DESIGN.md 的 SVG 尺寸事故） */
  var FLAG_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
    '<path d="M6.4 21V3.4" stroke="#5CB98F" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<path d="M6.6 4.1h10.6l-2.7 4 2.7 4H6.6z" fill="#5CB98F"/></svg>';
  var GIFT_BOX_SVG = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">' +
    '<ellipse cx="24" cy="19" rx="8.5" ry="5" fill="#E94F7B" transform="rotate(-20 24 19)"/>' +
    '<ellipse cx="40" cy="19" rx="8.5" ry="5" fill="#E94F7B" transform="rotate(20 40 19)"/>' +
    '<circle cx="32" cy="20" r="3.4" fill="#FFD1E0"/>' +
    '<rect x="9" y="25" width="46" height="10" rx="4" fill="#EF6A93"/>' +
    '<rect x="11" y="33" width="42" height="22" rx="5" fill="#F9A8C3"/>' +
    '<rect x="28.5" y="33" width="7" height="22" fill="#FFF2F6"/></svg>';

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var screens = { menu: $('screen-menu'), game: $('screen-game'), result: $('screen-result') };
  var keyboardEl = $('keyboard');
  var stageListEl = $('stage-list');
  var targetLetterEl = $('target-letter');
  var targetWordEl = $('target-word');
  var fingerHintEl = $('finger-hint');
  var mascotEl = $('mascot');
  var scorePopEl = $('score-pop');
  var comboBadgeEl = $('combo-badge');
  var progressFillEl = $('progress-fill');
  var gameProgressEl = $('game-progress');
  var gameLevelNameEl = $('game-level-name');
  var eyeModal = $('eye-modal');

  /* ---------- 存档（主档 + 自动备份，双保险） ---------- */
  var STORE_KEY = 'typing-monster-progress-v1';
  var BACKUP_KEY = STORE_KEY + '-backup';
  var restoredFromBackup = false;
  function parseStore(d) {
    return {
      progress: (d && d.progress) || {},
      daily: (d && d.daily) || {},
      heat: (d && d.heat) || {},
      stickers: (d && d.stickers) || {},
      growth: (d && d.growth) || {},
      settings: { sound: d && d.settings && d.settings.sound !== undefined ? d.settings.sound : true,
                  eyeMinutes: (d && d.settings && d.settings.eyeMinutes) || 15,
                  dailyMinutes: (d && d.settings && d.settings.dailyMinutes) || 10,
                  skin: (d && d.settings && d.settings.skin) || 'berry' }
    };
  }
  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return parseStore(JSON.parse(raw));
    } catch (e) { /* 主档损坏，走备份 */ }
    try {
      var backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        restoredFromBackup = true;
        return parseStore(JSON.parse(backup));
      }
    } catch (e2) { /* 备份也坏，按新玩家 */ }
    return { progress: {}, daily: {}, heat: {}, stickers: {}, settings: { sound: true, eyeMinutes: 15, dailyMinutes: 10, skin: 'berry' } };
  }
  function saveStore() {
    var payload = JSON.stringify(store);
    try {
      localStorage.setItem(STORE_KEY, payload);
      var backupPayload = JSON.parse(payload);
      backupPayload.savedAt = new Date().toISOString();
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupPayload));
      writeAutoArchive(); /* 开启了自动存档就静默同步一份到文件夹 */
    } catch (e) { /* 隐私模式等写不进去的场合静默失败，游戏照玩 */ }
  }
  var store = loadStore();

  /* ---------- 音效（Web Audio 现场合成，无音频文件） ---------- */
  var audioCtx = null;
  function beep(freqs, dur, gain) {
    if (!store.settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t0 = audioCtx.currentTime;
      for (var i = 0; i < freqs.length; i++) {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freqs[i];
        var t = t0 + i * 0.09;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      }
    } catch (e) { /* 音频不可用就静默 */ }
  }
  var SOUND = {
    correct: function () { beep([660, 880], 0.1, 0.1); },
    wrong: function () { beep([200, 165], 0.14, 0.07); },
    win: function () { beep([523, 659, 784, 1047], 0.18, 0.12); }
  };

  /* ---------- 音频解锁（iOS / 移动端） ----------
     iOS Safari 与高版本 Android 都要求音频由一次真实用户手势启动：
     ① AudioContext 不在手势里创建/恢复，会一直停在 suspended —— 一点声音都没有
     ② speechSynthesis 的第一次 speak 必须在手势里，否则被系统静默丢弃
     所以第一次触摸/按键就预热一次，而不是等第一个字母判定时才临时创建 */
  var audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* 没有音频输出设备时忽略 */ }
    try {
      if ('speechSynthesis' in window) {
        if (typeof speechSynthesis.getVoices === 'function') speechSynthesis.getVoices();
        var warm = new SpeechSynthesisUtterance(' ');
        warm.volume = 0;
        warm.lang = 'en-US';
        speechSynthesis.speak(warm);   /* 静音一条，把语音通道打通 */
      }
    } catch (e) { /* 忽略 */ }
  }
  /* 声音被系统挡住时给一句人话，而不是让孩子以为游戏坏了 */
  function warnIfSilent() {
    setTimeout(function () {
      if (audioCtx && audioCtx.state !== 'running') {
        showToast('声音被系统拦住了：iPhone 请把侧边静音拨片推上去、调大音量，再点一下屏幕', 6000);
      }
    }, 400);
  }

  /* ---------- 发音（Web Speech API） ---------- */
  var lastSpoken = '';
  var lastSpokenAt = 0;
  var speakTimer = null;
  var comboTimer = null;
  function speakLetter(ch, force) {
    if (!('speechSynthesis' in window)) return;
    var now = Date.now();
    if (!force && ch === lastSpoken && now - lastSpokenAt < 600) return;
    lastSpoken = ch;
    lastSpokenAt = now;
    try {
      /* iOS 上 cancel() 紧跟 speak() 会把这次发音吞掉，只在真的在说话时才取消 */
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(ch);
      u.lang = /[\u4e00-\u9fa5]/.test(ch) ? 'zh-CN' : 'en-US';
      u.rate = 0.8;
      u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { /* 发音不可用就静默 */ }
  }
  function clearSpeakTimer() {
    if (speakTimer) { clearTimeout(speakTimer); speakTimer = null; }
  }

  /* ---------- 关卡工具 ---------- */
  function flatLevels() {
    var flat = [];
    for (var s = 0; s < LEVELS.stages.length; s++) {
      var levels = LEVELS.stages[s].levels;
      for (var i = 0; i < levels.length; i++) flat.push({ stage: LEVELS.stages[s], level: levels[i] });
    }
    return flat;
  }
  function findLevel(levelId) {
    var flat = flatLevels();
    for (var i = 0; i < flat.length; i++) {
      if (flat[i].level.id === levelId) return { stage: flat[i].stage, level: flat[i].level, index: i };
    }
    return null;
  }
  function isUnlocked(levelId) {
    var flat = flatLevels();
    var idx = -1;
    for (var i = 0; i < flat.length; i++) if (flat[i].level.id === levelId) idx = i;
    if (idx <= 0) return true;
    var prev = flat[idx - 1].level;
    return (store.progress[prev.id] && store.progress[prev.id].stars >= 1) || false;
  }
  function nextLevelId(levelId) {
    var flat = flatLevels();
    for (var i = 0; i < flat.length; i++) {
      if (flat[i].level.id === levelId && i + 1 < flat.length) return flat[i + 1].level.id;
    }
    return null;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  /* 生成本关目标序列：单键模式 → 每目标一个字符；单词/句子模式 → 每目标一整串；拼音模式 → 每目标一个汉字加拼音串 */
  function buildQueue(level) {
    var targets = [];
    if (level.hanzi) {
      var hs = shuffle(level.hanzi.slice());
      for (var i = 0; i < hs.length; i++) {
        targets.push({ chars: hs[i].chars.slice(), label: hs[i].label, type: 'hanzi' });
      }
      return targets;
    }
    if (level.words) {
      var ws = shuffle(level.words.slice());
      for (var i2 = 0; i2 < ws.length; i2++) {
        targets.push({ chars: ws[i2].split(''), label: ws[i2], type: 'word' });
      }
      return targets;
    }
    var base = [];
    while (base.length < level.count) {
      for (var j = 0; j < level.keys.length; j++) base.push(level.keys[j]);
    }
    var q = shuffle(base.slice(0, level.count));
    for (var attempt = 0; attempt < 60; attempt++) {
      var ok = true;
      for (var k = 1; k < q.length - 1; k++) {
        if (q[k] === q[k - 1] && q[k] === q[k + 1]) { ok = false; break; }
      }
      if (ok) break;
      shuffle(q);
    }
    for (var m = 0; m < q.length; m++) targets.push({ chars: [q[m]], label: q[m].toUpperCase() });
    return targets;
  }

  /* ---------- 屏幕切换 ---------- */
  function show(name) {
    for (var k in screens) {
      if (k === 'result') {
        screens[k].classList.toggle('hidden', name !== 'result');
        screens[k].classList.toggle('active', name === 'result');
      } else {
        screens[k].classList.toggle('active', name === k);
      }
    }
    state.screen = name;
  }

  /* ---------- 关卡地图（多阶段） ---------- */
  /* ---------- 首页星星积分徽章 ---------- */
  function totalLevelCount() {
    var n = 0;
    for (var s = 0; s < LEVELS.stages.length; s++) n += LEVELS.stages[s].levels.length;
    return n;
  }
  var lastBadgeStars = -1;
  /* ---------- 成长条（mini 莓莓下方） ---------- */
  function renderGrowthBar() {
    var stars = totalStars();
    var stage = growthStage(stars);
    var next = null;
    for (var i = 0; i < GROWTH.length; i++) if (GROWTH[i].at > stars) { next = GROWTH[i]; break; }
    var bar = $('growth-bar');
    if (!bar) return;
    if (!next) {
      bar.innerHTML = '<div class="growth-name">『' + GROWTH[stage].name + '』已完全成长</div><div class="growth-track"><div class="growth-fill" style="width:100%"></div></div><div class="growth-hint">莓莓说：谢谢你陪我长大 💗</div>';
      return;
    }
    var prevAt = GROWTH[stage].at;
    var pct = Math.round((stars - prevAt) / (next.at - prevAt) * 100);
    var skinName = '';
    SKINS.forEach(function (sk) { if (sk.stars === next.at) skinName = sk.name; });
    bar.innerHTML =
      '<div class="growth-name">『' + GROWTH[stage].name + '』</div>' +
      '<div class="growth-track"><div class="growth-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="growth-hint">再喂 ' + (next.at - stars) + ' 颗星，莓莓进化并解锁' + (skinName ? '新衣服「' + skinName + '」' : '新形态') + '</div>';
  }

  function renderStarsBadge() {
    var done = 0;
    Object.keys(store.progress).forEach(function (id) {
      if (store.progress[id] && store.progress[id].stars > 0) done++;
    });
    var stars = totalStars();
    $('stars-count').textContent = stars;
    $('stars-progress').textContent = '通关 ' + done + ' / ' + totalLevelCount();
    if (lastBadgeStars >= 0 && stars !== lastBadgeStars) {
      var badge = $('stars-badge');
      badge.classList.remove('pop');
      void badge.offsetWidth;
      badge.classList.add('pop');
    }
    lastBadgeStars = stars;
  }

  function renderMenu() {
    renderStarsBadge();
    renderGrowthBar();
    checkEvolution();
    renderDailyGoal();
    renderSkinPicker();
    stageListEl.innerHTML = '';
    var currentAssigned = false;
    for (var s = 0; s < LEVELS.stages.length; s++) {
      (function (stage) {
        var block = document.createElement('div');
        block.className = 'stage-block';
        var head = document.createElement('div');
        head.className = 'stage-title';
        var badge = document.createElement('span');
        badge.className = 'stage-badge';
        badge.textContent = '阶段' + '一二三四五六七八'.charAt(s);
        var name = document.createElement('span');
        name.className = 'stage-name';
        name.textContent = stage.name;
        head.appendChild(badge);
        head.appendChild(name);
        var desc = document.createElement('p');
        desc.className = 'stage-desc';
        desc.textContent = stage.desc;
        var grid = document.createElement('div');
        grid.className = 'level-grid';
        stage.levels.forEach(function (lv, i) {
          var rec = store.progress[lv.id];
          var stars = rec ? rec.stars : 0;
          var unlocked = isUnlocked(lv.id);
          var isCurrent = unlocked && !currentAssigned && !rec;
          if (isCurrent) currentAssigned = true;
          var card = document.createElement('button');
          card.type = 'button';
          card.className = 'level-card' + (rec ? ' done' : '') + (isCurrent ? ' current' : '');
          card.disabled = !unlocked;
          var starHtml = '';
          for (var t = 0; t < 3; t++) starHtml += t < stars ? '★' : '☆';
          card.innerHTML =
            (rec ? '<span class="lv-flag">' + FLAG_SVG + '</span>' : '') +
            '<div class="lv-num">第 ' + (i + 1) + ' 关</div>' +
            '<div class="lv-name">' + lv.name + '</div>' +
            '<div class="lv-stars">' + (unlocked ? starHtml : '') + '</div>' +
            (isCurrent ? '<div class="lv-go">▶ 出发</div>' : (unlocked ? '' : '<div class="lv-lock">通过上一关解锁</div>'));
          if (unlocked) {
            card.addEventListener('click', function () { startLevel(lv.id); });
          }
          grid.appendChild(card);
        });
        block.appendChild(head);
        block.appendChild(desc);
        block.appendChild(grid);
        stageListEl.appendChild(block);
      })(LEVELS.stages[s]);
    }
    updateJumpBtn();
  }

  /* ---------- 回到当前关（29 关的长地图，滚太远时给个入口） ---------- */
  var jumpBtn = $('btn-jump');
  function updateJumpBtn() {
    if (!jumpBtn) return;
    var card = stageListEl.querySelector('.level-card.current');
    var passed = state.screen === 'menu' && card && card.getBoundingClientRect().bottom < 60;
    jumpBtn.classList.toggle('hidden', !passed);
  }
  function jumpToCurrent() {
    var card = stageListEl.querySelector('.level-card.current');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- 虚拟键盘 ---------- */
  /* 有触摸屏的设备（iPad / 平板 / 触屏本）才开放「点键作答」，
     电脑上没有触摸屏时保持只认物理键盘——避免孩子拿鼠标乱点冒充打字 */
  var touchTyping = (function () {
    try {
      if (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches) return true;
    } catch (e) { /* 忽略：老浏览器没有 matchMedia 时走下一层判断 */ }
    return 'ontouchstart' in window;
  })();

  function tapKey(code) {
    if (!code) return;
    var ch = code === 'space' ? ' ' : code;
    if (IGNORE_KEYS.indexOf(ch) >= 0) return;   /* 退格 / 回车 / Shift 不参与判定 */
    if (ch.length !== 1) return;
    inputChar(ch);
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = '';
    KEY_ROWS.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'krow';
      row.forEach(function (k) {
        var label = k[0], w = k[1], code = k[2];
        var keyEl = document.createElement('div');
        keyEl.className = 'key' + (w > 1.4 ? ' wide' : '') + (HOME_KEYS.indexOf(code) >= 0 ? ' home' : '');
        keyEl.style.setProperty('--w', w);
        keyEl.dataset.key = code;
        keyEl.textContent = label;
        if (touchTyping) {
          /* pointerdown 比 click 快，且能阻止 iOS 的选中/放大手势 */
          keyEl.addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            tapKey(this.dataset.key);
          });
        }
        rowEl.appendChild(keyEl);
      });
      keyboardEl.appendChild(rowEl);
    });
  }
  /* 字符 → 虚拟键盘键帽 code：空格键在键帽上叫 space，其余字符与 code 一致。
     句子关（阶段六）的目标里含空格字符，映射错就会找不到键帽——见 DESIGN.md。 */
  function charToCode(ch) {
    return ch === ' ' ? 'space' : ch;
  }
  function keyEl(k) {
    var code = charToCode(k);
    var all = keyboardEl.querySelectorAll('.key');
    for (var i = 0; i < all.length; i++) {
      if (all[i].dataset.key === code) return all[i];
    }
    return null;
  }
  function clearKeyMarks() {
    var all = keyboardEl.querySelectorAll('.key');
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove('target', 'wrong', 'right');
      var bubble = all[i].querySelector('.bubble');
      if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }
  }
  function markTarget(k) {
    clearKeyMarks();
    var el = keyEl(k);
    if (!el) return;
    el.classList.add('target');
    var bubble = document.createElement('span');
    bubble.className = 'bubble';
    el.appendChild(bubble);
  }

  /* ---------- 游戏状态 ---------- */
  var state = {
    screen: 'menu',
    levelId: null,
    targets: [],
    tIdx: 0,
    cIdx: 0,
    correct: 0,
    wrong: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    startAt: 0,
    lastInputAt: 0,
    inputGaps: [],
    eyeSeconds: 0,
    eyeTimer: null
  };

  function startLevel(levelId) {
    var found = findLevel(levelId);
    if (!found) return;
    var lv = found.level;
    state.levelId = levelId;
    state.targets = buildQueue(lv);
    state.tIdx = 0;
    state.cIdx = 0;
    state.correct = 0;
    state.wrong = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.score = 0;
    state.startAt = Date.now();
    state.lastInputAt = Date.now();
    state.inputGaps = [];
    state.eyeSeconds = 0;
    clearSpeakTimer();
    clearComboTimer();
    comboBadgeEl.classList.add('hidden');
    gameLevelNameEl.textContent = found.stage.name + ' · ' + lv.name;
    show('game');
    renderTarget();
    startEyeTimer();
  }

  /* ---------- 目标展示 ---------- */
  function renderWord(t) {
    targetWordEl.innerHTML = '';
    for (var i = 0; i < t.chars.length; i++) {
      var s = document.createElement('span');
      s.className = 'wchar';
      if (i < state.cIdx) s.classList.add('done');
      if (i === state.cIdx) s.classList.add('cur');
      if (t.chars[i] === ' ') {
        /* 空格用一小段圆角块可视化（纯空格字符看不见，孩子不知道要按空格键） */
        s.classList.add('space');
        s.setAttribute('aria-label', '空格');
      } else {
        s.textContent = t.chars[i];
      }
      targetWordEl.appendChild(s);
    }
  }

  function renderHanzi(t) {
    targetWordEl.innerHTML = '';
    var hz = document.createElement('div');
    hz.className = 'hz-label';
    hz.textContent = t.label;
    targetWordEl.appendChild(hz);
    var py = document.createElement('div');
    py.className = 'py-row';
    for (var i = 0; i < t.chars.length; i++) {
      var s = document.createElement('span');
      s.className = 'pychar';
      if (i < state.cIdx) s.classList.add('done');
      if (i === state.cIdx) s.classList.add('cur');
      s.textContent = t.chars[i];
      py.appendChild(s);
    }
    targetWordEl.appendChild(py);
  }

  function renderSequence(t) {
    if (t.type === 'hanzi') renderHanzi(t);
    else renderWord(t);
  }

  function clearComboTimer() {
    if (comboTimer) { clearTimeout(comboTimer); comboTimer = null; }
  }

  function renderTarget() {
    var t = state.targets[state.tIdx];
    var ch = t.chars[state.cIdx];
    gameProgressEl.textContent = state.tIdx + ' / ' + state.targets.length;
    progressFillEl.style.width = (state.tIdx / state.targets.length * 100) + '%';
    if (t.chars.length === 1) {
      targetLetterEl.classList.remove('hidden');
      targetWordEl.classList.add('hidden');
      targetLetterEl.textContent = t.label;
      targetLetterEl.style.animation = 'none';
      void targetLetterEl.offsetWidth;
      targetLetterEl.style.animation = '';
    } else {
      targetLetterEl.classList.add('hidden');
      targetWordEl.classList.remove('hidden');
      renderSequence(t);
    }
    fingerHintEl.textContent = KEY_FINGER[ch] || '';
    markTarget(ch);
    clearSpeakTimer();
    speakTimer = setTimeout(function () {
      speakLetter(t.chars.length === 1 ? ch : t.label);
    }, 700);
  }

  /* ---------- 按键处理 ---------- */
  function flashKey(el) {
    el.classList.remove('right');
    void el.offsetWidth;
    el.classList.add('right');
    setTimeout(function () { el.classList.remove('right'); }, 260);
  }

  function handleCorrect(el) {
    var now = Date.now();
    state.inputGaps.push((now - state.lastInputAt) / 1000);
    state.lastInputAt = now;
    var t = state.targets[state.tIdx];
    var ch = t.chars[state.cIdx];
    recordHeat(ch, true);

    /* 键帽可能不存在（极少数目标字符不在虚拟键盘上），此时也必须推进，不能静默卡死 */
    if (el) {
      el.classList.remove('target');
      flashKey(el);
    }
    state.cIdx++;

    if (state.cIdx >= t.chars.length) {
      /* 完成一个目标 */
      state.correct++;
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.score += 10;
      SOUND.correct();
      clearSpeakTimer();
      speakTimer = setTimeout(function () {
        speakLetter(t.chars.length === 1 ? ch : t.label, true);
      }, 280);
      scorePopEl.classList.remove('hidden', 'show');
      void scorePopEl.offsetWidth;
      scorePopEl.classList.add('show');
      mascotEl.classList.remove('bounce');
      void mascotEl.offsetWidth;
      mascotEl.classList.add('bounce');
      if (state.combo >= 3) {
        comboBadgeEl.textContent = '连击 x' + state.combo;
        comboBadgeEl.classList.remove('hidden');
        clearComboTimer();
        comboTimer = setTimeout(function () { comboBadgeEl.classList.add('hidden'); }, 1200);
      }
      state.tIdx++;
      state.cIdx = 0;
      if (state.tIdx >= state.targets.length) {
        finishLevel();
      } else {
        renderTarget();
      }
    } else {
      /* 目标内推进：只刷新展示和高亮，不朗读不计数 */
      if (t.chars.length > 1) renderSequence(t);
      var nextCh = t.chars[state.cIdx];
      fingerHintEl.textContent = KEY_FINGER[nextCh] || '';
      markTarget(nextCh);
    }
  }

  function handleWrong(k) {
    state.wrong++;
    recordHeat(k, false);
    state.combo = 0;
    clearComboTimer();
    comboBadgeEl.classList.add('hidden');
    SOUND.wrong();
    var el = keyEl(k);
    if (el) {
      el.classList.remove('wrong');
      void el.offsetWidth;
      el.classList.add('wrong');
      setTimeout(function () { el.classList.remove('wrong'); }, 320);
    }
  }

  /* 判定入口：物理键盘与触摸点按都走这里，规则完全一致 */
  function inputChar(k) {
    if (state.screen !== 'game') return;
    if (!k || k.length !== 1) return;
    var target = state.targets[state.tIdx].chars[state.cIdx];
    if (k === target) {
      /* 不依赖键帽是否存在：找不到键帽只是没有闪烁反馈，判定照常推进 */
      handleCorrect(keyEl(target));
    } else {
      handleWrong(k);
    }
  }

  function onKeyDown(e) {
    if (state.screen !== 'game') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (IGNORE_KEYS.indexOf(k) >= 0) return;
    if (k.length !== 1) return;
    e.preventDefault();
    inputChar(k);
  }

  /* ---------- 护眼 ---------- */
  function startEyeTimer() {
    stopEyeTimer();
    state.eyeTimer = setInterval(function () {
      state.eyeSeconds++;
      if (state.eyeSeconds >= store.settings.eyeMinutes * 60) {
        stopEyeTimer();
        $('eye-minutes').textContent = store.settings.eyeMinutes;
        state.screen = 'resting';
        eyeModal.classList.remove('hidden');
      }
    }, 1000);
  }
  function stopEyeTimer() {
    if (state.eyeTimer) { clearInterval(state.eyeTimer); state.eyeTimer = null; }
  }

  /* ---------- 结算 ---------- */
  function finishLevel() {
    stopEyeTimer();
    clearSpeakTimer();
    var total = (Date.now() - state.startAt) / 1000;
    var gaps = [];
    for (var i = 0; i < state.inputGaps.length; i++) {
      if (state.inputGaps[i] <= 10) gaps.push(state.inputGaps[i]);
    }
    var gapSum = 0;
    for (var j = 0; j < gaps.length; j++) gapSum += gaps[j];
    var avg = gaps.length > 0 ? gapSum / gaps.length : total / state.targets.length;
    var accuracy = state.correct / (state.correct + state.wrong);
    var perfect = state.wrong === 0;
    var stars = 1 + (accuracy >= 0.8 ? 1 : 0) + (accuracy >= 0.8 && avg <= 6 ? 1 : 0);

    var rec = store.progress[state.levelId] || { stars: 0 };
    rec.stars = Math.max(rec.stars, stars);
    store.progress[state.levelId] = rec;
    var daily = getDaily();
    daily.levels++;
    var justAchieved = addDailySeconds(gapSum); /* gapSum 单位已是秒 */
    saveStore();

    SOUND.win();

    $('result-title').textContent = perfect ? '完美过关' : '过关啦';
    var starsEl = $('result-stars');
    starsEl.textContent = '';
    for (var i2 = 0; i2 < 3; i2++) {
      var s = document.createElement('span');
      s.textContent = i2 < stars ? '★' : '☆';
      s.style.animation = 'pop 0.35s ease ' + (0.15 + i2 * 0.22) + 's both';
      starsEl.appendChild(s);
    }
    var detail;
    if (perfect) {
      detail = '完成 ' + state.correct + ' / ' + state.targets.length + ' · 一次没错，太棒了';
    } else {
      detail = '完成 ' + state.correct + ' / ' + state.targets.length + ' · 按错 ' + state.wrong + ' 次（没关系，下次会更好）';
    }
    detail += '<br>准确率 ' + Math.round(accuracy * 100) + '% · 平均每个目标 ' + avg.toFixed(1) +
      ' 秒 · 最高连击 x' + state.maxCombo;
    if (justAchieved) {
      detail += '<br><span class="daily-goal-line">今日目标达成！莓莓今天吃饱啦，去玩吧 🎉</span>';
    } else if (store.daily[todayKey()].seconds < dailyGoalSeconds()) {
      detail += '<br><span class="daily-goal-line">今日目标 ' + Math.floor(store.daily[todayKey()].seconds / 60) +
        ' / ' + store.settings.dailyMinutes + ' 分钟</span>';
    }
    if (stars < 2 && accuracy < 0.8) {
      detail += '<br><span class="star-goal">离 2 星还差一点：按对要到八成，现在 ' + Math.round(accuracy * 100) + '%</span>';
    } else if (stars < 3 && accuracy >= 0.8 && avg > 6) {
      detail += '<br><span class="star-goal">离 3 星还差一点：平均每个目标 6 秒内，现在 ' + avg.toFixed(1) + ' 秒</span>';
    }
    $('result-detail').innerHTML = detail;

    var nextBtn = $('btn-next');
    var nid = nextLevelId(state.levelId);
    if (nid) {
      nextBtn.disabled = false;
      nextBtn.textContent = '下一关';
      nextBtn.onclick = function () { startLevel(nid); };
    } else {
      nextBtn.disabled = true;
      nextBtn.textContent = '全部通关啦';
    }
    var giftBtn = $('btn-gift-open');
    giftBtn.disabled = false;
    giftBtn.textContent = '打开看看';
    $('result-gift').classList.remove('gift-pop');
    rollGift();
    show('result');
  }

  /* ---------- 键位热力图数据 ---------- */
  /* 键位热力图按「键帽 code」存，空格记成 space（统计弹窗按 code 查表） */
  function recordHeat(k, ok) {
    var code = charToCode(k);
    if (!store.heat[code]) store.heat[code] = { r: 0, w: 0 };
    if (ok) store.heat[code].r++;
    else store.heat[code].w++;
  }

  /* ---------- 每日目标 ---------- */
  function todayKey() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }
  function getDaily(key) {
    var k = key || todayKey();
    if (!store.daily[k]) store.daily[k] = { seconds: 0, levels: 0, achieved: false };
    return store.daily[k];
  }
  function dailyGoalSeconds() { return store.settings.dailyMinutes * 60; }
  function dailyProgressText() {
    var d = getDaily();
    var goal = dailyGoalSeconds();
    var mins = Math.floor(d.seconds / 60);
    if (d.seconds >= goal) return '今天吃饱啦，目标达成 🎉';
    return '今日目标 ' + mins + ' / ' + store.settings.dailyMinutes + ' 分钟';
  }
  /* 把本关活跃时长计入今天；返回是否刚刚达成目标 */
  function addDailySeconds(sec) {
    var d = getDaily();
    var wasAchieved = d.achieved;
    d.seconds += Math.round(sec);
    if (!wasAchieved && d.seconds >= dailyGoalSeconds()) {
      d.achieved = true;
      return true;
    }
    return false;
  }
  function renderDailyGoal() {
    var el = $('daily-goal');
    if (!el) return;
    var d = getDaily();
    var goal = dailyGoalSeconds();
    var pct = Math.min(100, d.seconds / goal * 100);
    var achieved = d.seconds >= goal;
    el.classList.toggle('done', achieved);
    $('daily-goal-text').textContent = dailyProgressText();
    $('daily-goal-fill').style.width = pct + '%';
    var pctEl = $('daily-goal-pct');
    if (pctEl) pctEl.textContent = achieved ? '达成' : Math.round(pct) + '%';
  }

  /* ---------- 奇遇彩蛋：礼物盒与贴纸图鉴 ---------- */
  var STICKERS = ['🍓', '🌟', '🐱', '🦋', '🌈', '🍭', '🎈', '🌻', '🐬', '🧸', '🍰', '⚡'];
  function rollGift() {
    var giftEl = $('result-gift');
    if (!giftEl) return;
    if (Math.random() < 0.4) {
      giftEl.classList.remove('hidden');
      giftEl.classList.remove('opened');
      $('gift-box').innerHTML = GIFT_BOX_SVG;
      $('gift-hint').textContent = '莓莓发现一个神秘礼物盒！';
    } else {
      giftEl.classList.add('hidden');
    }
  }
  function openGift() {
    var giftEl = $('result-gift');
    if (giftEl.classList.contains('opened')) return;
    giftEl.classList.add('opened');
    var s = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    if (!store.stickers || typeof store.stickers !== 'object') store.stickers = {};
    store.stickers[s] = (store.stickers[s] || 0) + 1;
    saveStore();
    $('gift-box').textContent = s;
    $('gift-hint').textContent = '获得贴纸「' + s + '」！已收进图鉴';
    giftEl.classList.add('gift-pop');
    var btn = $('btn-gift-open');
    btn.disabled = true;
    btn.textContent = '已收好';
  }
  function stickerCount() {
    var n = 0;
    if (store.stickers) Object.keys(store.stickers).forEach(function (k) { n += store.stickers[k]; });
    return n;
  }
  function renderStickerBook() {
    var grid = $('sticker-grid');
    if (!grid) return;
    var owned = store.stickers || {};
    var got = 0;
    var html = '';
    STICKERS.forEach(function (s) {
      if (owned[s]) { got++; html += '<div class="sticker-cell have" title="x' + owned[s] + '"><span class="sticker-emoji">' + s + '</span></div>'; }
      else { html += '<div class="sticker-cell"><span class="sticker-emoji">?</span></div>'; }
    });
    grid.innerHTML = html;
    $('sticker-progress').textContent = '已收集 ' + got + ' / ' + STICKERS.length + ' 种' + (stickerCount() > got ? ' · 重复的会累计数量' : '');
  }

  /* ---------- 莓莓养成线 ---------- */
  var GROWTH = [
    { at: 0,  id: 0, name: '莓莓宝宝' },
    { at: 10, id: 1, name: '莓莓' },
    { at: 25, id: 2, name: '莓莓·星冠' },
    { at: 45, id: 3, name: '莓莓·星翼' }
  ];
  function growthStage(stars) {
    var s = 0;
    for (var i = 0; i < GROWTH.length; i++) if (stars >= GROWTH[i].at) s = GROWTH[i].id;
    return s;
  }
  function applyGrowth() {
    var stage = growthStage(totalStars());
    var all = document.querySelectorAll('.mascot');
    for (var i = 0; i < all.length; i++) {
      for (var g = 0; g < GROWTH.length; g++) all[i].classList.remove('g-' + g);
      all[i].classList.add('g-' + stage);
    }
    return stage;
  }
  /* 回地图时检测进化：跨阶段则弹庆祝 */
  function checkEvolution() {
    var stage = applyGrowth();
    var celebrated = (typeof store.growth === 'object' && store.growth && store.growth.celebrated) || 0;
    if (stage > celebrated) {
      if (typeof store.growth !== 'object' || !store.growth) store.growth = {};
      store.growth.celebrated = stage;
      saveStore();
      showEvolutionModal(stage);
    }
  }
  function showEvolutionModal(stage) {
    var g = GROWTH[stage];
    $('evo-title').textContent = '莓莓进化啦！';
    $('evo-name').textContent = '现在是「' + g.name + '」';
    var skinTip = '';
    SKINS.forEach(function (sk) { if (sk.stars === g.at && sk.stars > 0) skinTip = '新衣服「' + sk.name + '」已解锁，快去换上！'; });
    $('evo-skin-tip').textContent = skinTip;
    var preview = $('evo-mascot');
    preview.className = 'mascot';
    applySkinTo(preview);
    preview.classList.add('g-' + stage);
    var modal = $('evo-modal');
    modal.classList.remove('hidden');
    SOUND.win();
  }

  /* ---------- 皮肤系统 ---------- */
  var SKINS = [
    { id: 'berry', name: '莓莓', stars: 0 },
    { id: 'blueberry', name: '蓝莓', stars: 10 },
    { id: 'lemon', name: '柠檬', stars: 25 },
    { id: 'grape', name: '葡萄', stars: 45 }
  ];
  function applySkinTo(el) {
    SKINS.forEach(function (sk) { el.classList.remove('skin-' + sk.id); });
    el.classList.add('skin-' + (store.settings.skin || 'berry'));
  }
  function applySkin() {
    var all = document.querySelectorAll('.mascot');
    for (var i = 0; i < all.length; i++) applySkinTo(all[i]);
  }
  function renderSkinPicker() {
    var el = $('skin-picker');
    if (!el) return;
    el.innerHTML = '';
    var stars = totalStars();
    SKINS.forEach(function (sk) {
      var unlocked = stars >= sk.stars;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'skin-dot' + (store.settings.skin === sk.id ? ' active' : '') + (unlocked ? '' : ' locked');
      b.innerHTML =
        '<span class="skin-dot-color s-' + sk.id + '"></span>' +
        '<span class="skin-dot-name">' + sk.name + '</span>' +
        (unlocked ? '' : '<span class="skin-dot-lock">' + sk.stars + '★ 解锁</span>');
      if (unlocked) {
        b.addEventListener('click', function () {
          store.settings.skin = sk.id;
          saveStore();
          applySkin();
          renderSkinPicker();
          var mini = $('mascot-mini');
          if (mini) {
            mini.classList.remove('bounce');
            void mini.offsetWidth;
            mini.classList.add('bounce');
            setTimeout(function () { mini.classList.remove('bounce'); }, 500);
          }
          showToast('莓莓换上了「' + sk.name + '」新衣服', 2500);
        });
      } else {
        b.addEventListener('click', function () {
          showToast('再攒 ' + (sk.stars - stars) + ' 颗星就能解锁「' + sk.name + '」（现在 ' + stars + ' 颗）', 3000);
        });
      }
      el.appendChild(b);
    });
  }

  /* ---------- 家长统计页 ---------- */
  var statsModal = $('stats-modal');
  function totalStars() {
    var n = 0;
    Object.keys(store.progress).forEach(function (id) {
      n += (store.progress[id] && store.progress[id].stars) || 0;
    });
    return n;
  }
  function totalLevels() {
    var n = 0;
    LEVELS.stages.forEach(function (st) { n += st.levels.length; });
    return n;
  }
  function practiceStats() {
    var days = 0, seconds = 0;
    Object.keys(store.daily).forEach(function (k) {
      if (store.daily[k] && store.daily[k].seconds > 0) { days++; seconds += store.daily[k].seconds; }
    });
    return { days: days, minutes: Math.floor(seconds / 60) };
  }
  function renderStats() {
    /* 总览 */
    var p = practiceStats();
    var d = getDaily();
    $('stats-overview').innerHTML =
      '<div class="stat-cell"><b>' + Object.keys(store.progress).length + ' / ' + totalLevels() + '</b><span>已通关</span></div>' +
      '<div class="stat-cell"><b>' + totalStars() + '</b><span>总星星</span></div>' +
      '<div class="stat-cell"><b>' + p.days + ' 天</b><span>练习天数</span></div>' +
      '<div class="stat-cell"><b>' + p.minutes + ' 分钟</b><span>累计时长</span></div>' +
      '<div class="stat-cell"><b>' + Math.floor(d.seconds / 60) + ' 分钟</b><span>今天</span></div>';

    /* 各阶段进度 */
    var stagesHtml = '';
    var CN = '一二三四五六七八';
    LEVELS.stages.forEach(function (st, si) {
      var done = 0, stars = 0;
      st.levels.forEach(function (lv) {
        var rec = store.progress[lv.id];
        if (rec) { done++; stars += rec.stars || 0; }
      });
      var pct = done / st.levels.length * 100;
      stagesHtml +=
        '<div class="stat-stage-row">' +
          '<span class="stat-stage-name">阶段' + CN.charAt(si) + ' ' + st.name + '</span>' +
          '<span class="stat-stage-nums">' + done + '/' + st.levels.length + ' 关 · ' + stars + '★</span>' +
        '</div>' +
        '<div class="progress-track slim"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
    });
    $('stats-stages').innerHTML = stagesHtml;

    /* 键位热力图 */
    var heatHtml = '';
    KEY_ROWS.forEach(function (row) {
      heatHtml += '<div class="krow">';
      row.forEach(function (k) {
        var code = k[2];
        var h = store.heat[code];
        var cls = 'heat-key';
        var label = code === 'space' ? '␣' : code.toUpperCase();
        if (h) {
          var total = h.r + h.w;
          var rate = h.w / total;
          if (h.w === 0) cls += ' h-ok';
          else if (rate > 0.3) cls += ' h-bad';
          else if (rate > 0.12) cls += ' h-mid';
          else cls += ' h-ok';
        } else {
          cls += ' h-none';
        }
        heatHtml += '<div class="' + cls + '" style="flex:' + k[1] + '">' + label + '</div>';
      });
      heatHtml += '</div>';
    });
    $('stats-heat').innerHTML = heatHtml;

    /* 错误 Top5 */
    var errs = Object.keys(store.heat).map(function (key) {
      return { key: key, w: store.heat[key].w, r: store.heat[key].r };
    }).filter(function (x) { return x.w > 0; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 5);
    $('stats-heat-tip').innerHTML = errs.length
      ? '错得最多：' + errs.map(function (x) {
          return '<b>' + (x.key === 'space' ? '空格' : x.key.toUpperCase()) + '</b>（错 ' + x.w + ' 次）';
        }).join('、')
      : '还没有错误记录，或者孩子还没开始练——练几关后这里会指出薄弱键位。';

    /* 每日目标设置 */
    var dailyHtml = '';
    [5, 10, 15, 20].forEach(function (m) {
      dailyHtml += '<button type="button" class="chip goal-opt' +
        (store.settings.dailyMinutes === m ? ' active' : '') + '" data-min="' + m + '">' + m + ' 分钟</button>';
    });
    $('stats-daily').innerHTML = dailyHtml;
    Array.prototype.forEach.call($('stats-daily').querySelectorAll('.goal-opt'), function (btn) {
      btn.addEventListener('click', function () {
        store.settings.dailyMinutes = parseInt(btn.getAttribute('data-min'), 10);
        saveStore();
        renderStats();
        renderDailyGoal();
        showToast('每日目标已设为 ' + store.settings.dailyMinutes + ' 分钟', 2500);
      });
    });
  }

  /* ---------- 存档管理 ---------- */
  var archiveModal = $('archive-modal');
  var toastTimer = null;
  function showToast(msg, ms) {
    var t = $('restore-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, ms || 4000);
  }
  function archiveSummary() {
    var ids = Object.keys(store.progress);
    var stars = 0;
    ids.forEach(function (id) { stars += (store.progress[id] && store.progress[id].stars) || 0; });
    var total = 0;
    LEVELS.stages.forEach(function (st) { total += st.levels.length; });
    return '已通关 ' + ids.length + ' / ' + total + ' 关 · 共获得 ' + stars + ' 颗星';
  }
  function exportArchive() {
    var data = JSON.parse(JSON.stringify(store));
    data.savedAt = new Date().toISOString();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    a.href = URL.createObjectURL(blob);
    a.download = '打字小怪兽存档-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    showToast('存档文件已开始下载，建议放到「文档」文件夹收好');
  }
  function importArchive(ev) {
    var file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        if (!d || typeof d.progress !== 'object' || d.progress === null) {
          throw new Error('bad format');
        }
        store = parseStore(d);
        saveStore();
        renderMenu();
        archiveModal.classList.add('hidden');
        showToast('导入成功，进度已恢复', 3000);
      } catch (e) {
        showToast('导入失败：这个文件不是有效的存档', 4000);
      }
    };
    reader.readAsText(file);
  }

  /* ---------- 自动存档到文件夹（File System Access API） ---------- */
  var AUTO_DB = 'typing-monster-auto-v1';
  var AUTO_STORE = 'handles';
  var autoDirHandle = null;
  var autoWriting = false;

  function autoArchiveSupported() {
    return typeof window.showDirectoryPicker === 'function' && 'indexedDB' in window;
  }
  function idbReq(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbOpen() {
    return idbReq(indexedDB.open(AUTO_DB, 1));
  }
  function idbGet(key) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(AUTO_DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(AUTO_STORE); };
      req.onsuccess = function () {
        try {
          var tx = req.result.transaction(AUTO_STORE, 'readonly');
          var r = tx.objectStore(AUTO_STORE).get(key);
          r.onsuccess = function () { resolve(r.result || null); };
          r.onerror = function () { reject(r.error); };
        } catch (e) { reject(e); }
      };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbPut(key, val) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(AUTO_DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(AUTO_STORE); };
      req.onsuccess = function () {
        try {
          var tx = req.result.transaction(AUTO_STORE, 'readwrite');
          tx.objectStore(AUTO_STORE).put(val, key);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { reject(tx.error); };
        } catch (e) { reject(e); }
      };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbDel(key) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(AUTO_DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(AUTO_STORE); };
      req.onsuccess = function () {
        try {
          var tx = req.result.transaction(AUTO_STORE, 'readwrite');
          tx.objectStore(AUTO_STORE).delete(key);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { reject(tx.error); };
        } catch (e) { reject(e); }
      };
      req.onerror = function () { reject(req.error); };
    });
  }
  async function verifyDirHandle(handle, ask) {
    try {
      var opt = { mode: 'readwrite' };
      if ((await handle.queryPermission(opt)) === 'granted') return true;
      if (ask && (await handle.requestPermission(opt)) === 'granted') return true;
    } catch (e) { /* 权限 API 异常按未授权处理 */ }
    return false;
  }
  function autoStamp() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }
  async function writeAutoArchive() {
    if (!autoDirHandle || autoWriting) return;
    autoWriting = true;
    try {
      var payload = JSON.stringify(store, null, 2) + '\n';
      var stamp = autoStamp();
      var snapshotName = 'typing-monster-progress-' + stamp + '.json';
      var files = ['typing-monster-progress.json', snapshotName];
      for (var i = 0; i < files.length; i++) {
        var fh = await autoDirHandle.getFileHandle(files[i], { create: true });
        var w = await fh.createWritable();
        await w.write(payload);
        await w.close();
      }
      pruneAutoSnapshots();
    } catch (e) {
      /* 目录被删/权限失效：静默降级，下次点按钮重新授权；不打扰孩子 */
      if (e && e.name === 'NotFoundError') {
        autoDirHandle = null;
        idbDel('dir').catch(function () {});
        refreshAutoArchiveUI();
      }
    } finally {
      autoWriting = false;
    }
  }
  async function pruneAutoSnapshots() {
    try {
      var names = [];
      var it = autoDirHandle.values();
      var entry = await it.next();
      while (!entry.done) {
        if (entry.value.name.indexOf('typing-monster-progress-') === 0) names.push(entry.value.name);
        entry = await it.next();
      }
      names.sort();
      while (names.length > 5) {
        var oldest = names.shift();
        await autoDirHandle.removeEntry(oldest);
      }
    } catch (e) { /* 清理失败无所谓，不影响主流程 */ }
  }
  async function enableAutoArchive() {
    if (!autoArchiveSupported()) {
      showToast('这个浏览器不支持自动存档（需桌面版 Chrome/Edge）。iPad 上请用「导出存档」手动备份', 7000);
      return;
    }
    try {
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await idbPut('dir', handle);
      autoDirHandle = handle;
      await writeAutoArchive();
      refreshAutoArchiveUI();
      showToast('自动存档已开启，进度会实时写入这个文件夹', 4500);
    } catch (e) {
      if (e && e.name === 'AbortError') return; /* 用户取消选择 */
      showToast('开启失败：' + (e && e.message ? e.message : '未知错误'), 5000);
    }
  }
  async function disableAutoArchive() {
    autoDirHandle = null;
    try { await idbDel('dir'); } catch (e) { /* 忽略 */ }
    refreshAutoArchiveUI();
    showToast('自动存档已关闭（文件夹里的文件不会被删除）', 4500);
  }
  function refreshAutoArchiveUI(needReauth) {
    var status = $('auto-archive-status');
    var btn = $('btn-auto-archive');
    if (!status || !btn) return;
    if (!autoArchiveSupported()) {
      status.textContent = '这个浏览器不支持（需桌面版 Chrome/Edge）。iPad 上请用「导出存档」手动备份';
      btn.textContent = '开启自动存档';
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
    if (needReauth) {
      status.textContent = '曾开启过，需重新授权文件夹';
      btn.textContent = '重新授权';
    } else if (autoDirHandle) {
      status.textContent = '已开启 · 正在写入「' + (autoDirHandle.name || '所选文件夹') + '」';
      btn.textContent = '关闭自动存档';
    } else {
      status.textContent = '未开启';
      btn.textContent = '开启自动存档';
    }
  }
  async function initAutoArchive() {
    if (!autoArchiveSupported()) { refreshAutoArchiveUI(); return; }
    try {
      var handle = await idbGet('dir');
      if (!handle) return;
      if (await verifyDirHandle(handle, false)) {
        autoDirHandle = handle;
        refreshAutoArchiveUI();
        writeAutoArchive(); /* 启动即同步一次，文件夹里永远是最新进度 */
      } else {
        refreshAutoArchiveUI(true); /* 权限需重新授予，等用户点按钮 */
      }
    } catch (e) { /* 初始化失败不影响游戏 */ }
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $('btn-quit').addEventListener('click', function () {
      stopEyeTimer();
      clearSpeakTimer();
      renderMenu();
      show('menu');
    });
    $('btn-retry').addEventListener('click', function () { startLevel(state.levelId); });
    $('btn-back-menu').addEventListener('click', function () { renderMenu(); show('menu'); });
    $('btn-eye-ok').addEventListener('click', function () {
      eyeModal.classList.add('hidden');
      state.screen = 'game';
      state.eyeSeconds = 0;
      startEyeTimer();
    });
    $('btn-sound').addEventListener('click', function () {
      store.settings.sound = !store.settings.sound;
      saveStore();
      syncSoundBtn();
      if (store.settings.sound) {
        unlockAudio();          /* 这一下点击本身就是手势，正好用来解锁 */
        SOUND.correct();        /* 给一声确认：开了就该听见 */
        warnIfSilent();
      }
    });
    $('btn-archive').addEventListener('click', function () {
      $('archive-summary').textContent = archiveSummary();
      refreshAutoArchiveUI();
      archiveModal.classList.remove('hidden');
    });
    $('btn-archive-close').addEventListener('click', function () {
      archiveModal.classList.add('hidden');
    });
    $('btn-stats').addEventListener('click', function () {
      renderStats();
      statsModal.classList.remove('hidden');
    });
    $('btn-evo-ok').addEventListener('click', function () {
      $('evo-modal').classList.add('hidden');
    });
    $('btn-book').addEventListener('click', function () {
      renderStickerBook();
      $('book-modal').classList.remove('hidden');
    });
    $('btn-book-close').addEventListener('click', function () {
      $('book-modal').classList.add('hidden');
    });
    $('btn-gift-open').addEventListener('click', openGift);
    $('btn-stats-close').addEventListener('click', function () {
      statsModal.classList.add('hidden');
    });
    $('btn-export').addEventListener('click', exportArchive);
    $('btn-import').addEventListener('click', function () { $('import-file').click(); });
    $('import-file').addEventListener('change', importArchive);
    $('btn-auto-archive').addEventListener('click', function () {
      if (autoDirHandle) disableAutoArchive();
      else enableAutoArchive();
    });
    document.addEventListener('keydown', onKeyDown);
    /* 捕获阶段预热音频：第一次点屏幕或按任意键就把声音通道打开 */
    document.addEventListener('pointerdown', unlockAudio, true);
    document.addEventListener('touchstart', unlockAudio, true);
    document.addEventListener('keydown', unlockAudio, true);
    if (jumpBtn) jumpBtn.addEventListener('click', jumpToCurrent);
    window.addEventListener('scroll', updateJumpBtn, { passive: true });
    window.addEventListener('resize', updateJumpBtn);
  }

  /* 音效按钮状态同步：拨钮视觉 + 无障碍状态，替代原来往文字里拼“开/关” */
  function syncSoundBtn() {
    var btn = $('btn-sound');
    if (!btn) return;
    btn.classList.toggle('off', !store.settings.sound);
    btn.setAttribute('aria-pressed', store.settings.sound ? 'true' : 'false');
    btn.title = store.settings.sound ? '音效已开启，点击关闭' : '音效已关闭，点击开启';
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderKeyboard();
    applySkin();
    renderMenu();
    syncSoundBtn();
    bindEvents();
    if (restoredFromBackup) {
      saveStore(); /* 立刻用备份重建主档，不等下次通关 */
      showToast('检测到主存档异常，已自动从备份恢复进度', 6000);
    }
    initAutoArchive();
  }
  init();
})();

/* 打字小怪兽 · 端到端测试（真实 Chrome + 真实键盘事件）
 * 运行：node tests/e2e.js
 * 覆盖：地图渲染 / 单键全流程 / 单词序列 / 汉字模式 / 短句空格 /
 *       护眼锁定 / 进度持久化 / 气泡堆积回归 / 发音时序回归
 */
'use strict';

const { chromium } = require('playwright-core');

const BASE = 'http://127.0.0.1:8321/index.html';
// Set CHROME_PATH env var to pin a specific Chrome build; otherwise let
// playwright-core use the bundled chromium.
const CHROME = process.env.CHROME_PATH || undefined;
const STORE_KEY = 'typing-monster-progress-v1';

let passed = 0, failed = 0;
const failures = [];

function check(name, cond, extra) {
  if (cond) { passed++; console.log('  PASS ' + name + (extra ? '  [' + extra + ']' : '')); }
  else { failed++; failures.push(name); console.log('  FAIL ' + name + (extra ? '  [' + extra + ']' : '')); }
}

/* 灌存档：progress 全解锁，settings 可调（默认已庆祝全部进化，模拟老玩家） */
async function seed(page, progress, settings) {
  await page.evaluate(([key, p, s]) => {
    localStorage.setItem(key, JSON.stringify({
      progress: p || {},
      growth: { celebrated: 3 },
      settings: Object.assign({ sound: false, eyeMinutes: 15 }, s || {})
    }));
  }, [STORE_KEY, progress, settings]);
}

const FULL_UNLOCK = {};
for (let s = 1; s <= 6; s++) for (let i = 1; i <= 12; i++) FULL_UNLOCK[s + '-' + i] = { stars: 1 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => { failed++; failures.push('JS 运行时错误: ' + e.message); console.log('  FAIL pageerror: ' + e.message); });

  /* ---------- T1 地图渲染 ---------- */
  console.log('\n[T1] 关卡地图渲染');
  await page.goto(BASE);
  await page.waitForSelector('.level-card');
  const stageCount = await page.locator('.stage-block, .stage-badge').count();
  const cards = await page.locator('.level-card').count();
  const enabled = await page.locator('.level-card:not([disabled])').count();
  check('阶段区块 6 个', stageCount >= 6, stageCount + '');
  check('关卡卡共 29 张', cards === 29, cards + '');
  check('新玩家仅解锁第 1 关', enabled === 1, enabled + '');

  /* ---------- T2 单键模式完整流程（含按错） ---------- */
  console.log('\n[T2] 阶段一 1-1 全流程（12 目标，按错 1 次）');
  await page.locator('.level-card:not([disabled])').first().click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  const total1 = await page.locator('#game-progress').textContent();
  check('进入游戏，进度 0/N', /^0 \/ \d+$/.test(total1.trim()), total1.trim());

  let wrongDone = false;
  for (let i = 0; i < 12; i++) {
    const target = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
    if (i === 3 && !wrongDone) {
      await page.keyboard.press(target === 'a' ? 'b' : 'a'); // 故意按错
      wrongDone = true;
      await sleep(80);
      const after = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
      check('按错后目标不切换', after === target, '仍为 ' + after);
    }
    await page.keyboard.press(target);
    await sleep(80);
  }
  await page.waitForSelector('#screen-result:not(.hidden)', { timeout: 4000 });
  const detail = await page.locator('#result-detail').textContent();
  check('结算面板出现', true);
  check('结算含按错次数', /按错 1 次/.test(detail), detail.slice(0, 40));
  check('结算含准确率', /准确率 \d+%/.test(detail));
  const stars = (await page.locator('#result-stars').textContent()).match(/★/g) || [];
  check('按错 1 次仍至少 2 星（80% 标准）', stars.length >= 2, stars.length + ' 星');
  check('结算规则行展示', /完成本关/.test(await page.locator('.result-rules').textContent()));

  /* ---------- T3 反馈细节 + 气泡回归 ---------- */
  console.log('\n[T3] 按键反馈细节 / 气泡堆积回归 / 连击');
  await page.locator('#btn-retry').click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  for (let i = 0; i < 3; i++) {
    const t = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
    await page.keyboard.press(t);
    await sleep(80);
    if (i === 0) {
      check('按对后手指提示有内容', (await page.locator('#finger-hint').textContent()).trim().length > 0);
      check('按对后目标键高亮', await page.locator('.key.target').count() === 1);
      const bubbles = await page.locator('.key .bubble').count();
      check('气泡全局仅 1 个（不堆积）', bubbles === 1, bubbles + '');
      const prog = (await page.locator('#game-progress').textContent()).trim();
      check('进度推进到 1/N', /^1 \/ \d+$/.test(prog), prog);
      check('进度条宽度非零', await page.locator('#progress-fill').evaluate((el) => parseFloat(el.style.width) > 0));
    }
    if (i === 2) {
      check('3 连击出 combo 徽章', await page.locator('#combo-badge:not(.hidden)').count() === 1);
      const combo = await page.locator('#combo-badge').textContent();
      check('combo 徽章显示连击数', /x3/.test(combo), combo.trim());
    }
  }

  /* ---------- T4 单词模式（阶段四） ---------- */
  console.log('\n[T4] 单词模式 4-1（含目标内按错不清进度）');
  await seed(page, FULL_UNLOCK);
  await page.reload();
  await page.waitForSelector('.level-card');
  await page.locator('.level-card').nth(16).click(); // 4-1
  await page.waitForSelector('#target-word:not(.hidden)');
  check('目标区显示单词', (await page.locator('#target-word .wchar').count()) >= 3);
  const word = (await page.locator('#target-word').textContent()).trim().toLowerCase();
  check('读取到目标单词', word.length >= 3, word);
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ' ') continue;
    if (i === 1) { // 词中故意按错一次
      await page.keyboard.press(word[i] === 'a' ? 'b' : 'a');
      await sleep(60);
      const doneN = await page.locator('#target-word .wchar.done').count();
      check('词内按错不清空已按对字母', doneN === i, 'done=' + doneN);
    }
    await page.keyboard.press(word[i]);
    await sleep(60);
  }
  await sleep(120);
  const prog4 = (await page.locator('#game-progress').textContent()).trim();
  check('完成第一个词后计数 +1', /^1 \//.test(prog4), prog4);
  check('单词模式目标键高亮正常', await page.locator('.key.target').count() === 1);
  await page.locator('#btn-quit').click();
  await page.waitForSelector('#screen-menu.active');

  /* ---------- T5 汉字模式（阶段五） ---------- */
  console.log('\n[T5] 汉字模式 5-1');
  await page.locator('.level-card').nth(21).click(); // 5-1
  await page.waitForSelector('#target-word:not(.hidden)');
  check('大号汉字显示', await page.locator('#target-word .hz-label').count() === 1);
  const hz = (await page.locator('.hz-label').textContent()).trim();
  check('汉字非空', /^[\u4e00-\u9fa5]$/.test(hz), hz);
  const pyCount = await page.locator('.pychar').count();
  check('拼音字母行渲染', pyCount >= 2, pyCount + ' 个');
  const firstPy = (await page.locator('.pychar.cur').textContent()).trim().toLowerCase();
  await page.keyboard.press(firstPy);
  await sleep(60);
  check('按对后拼音推进', await page.locator('.pychar.done').count() === 1);
  check('当前字母下划线光标移动', await page.locator('.pychar.cur').count() === 1);
  await page.locator('#btn-quit').click();
  await page.waitForSelector('#screen-menu.active');

  /* ---------- T6 短句空格（阶段六） ---------- */
  console.log('\n[T6] 短句模式 6-1（含空格的句子必须能打完）');
  await page.locator('.level-card').nth(26).click(); // 6-1
  await page.waitForSelector('#target-word:not(.hidden)');
  /* 用 offsetWidth/offsetHeight 量，避开入场动画 scale 的影响 */
  const spBox = await page.locator('.wchar.space').first().evaluate((el) =>
    ({ w: el.offsetWidth, h: el.offsetHeight }));
  check('空格块可视化且有尺寸',
    (await page.locator('.wchar.space').count()) >= 1 && spBox.w > 5 && spBox.h >= 4,
    spBox.w + 'x' + spBox.h);
  const w6 = await page.locator('#target-word .wchar').evaluateAll((els) =>
    els.map((e) => (e.classList.contains('space') ? ' ' : e.textContent)));
  check('读取到含空格的句子', w6.indexOf(' ') > 0, w6.join(''));

  let spaceChecked = false;
  for (let i = 0; i < w6.length; i++) {
    if (w6[i] === ' ') {
      const curSpace = await page.locator('.wchar.space.cur').count();
      const keyOn = await page.locator('.key[data-key="space"].target').count();
      const hint6 = (await page.locator('#finger-hint').textContent()).trim();
      check('空格成当前字符时高亮空格键', curSpace === 1 && keyOn === 1, 'cur=' + curSpace + ' key=' + keyOn);
      check('空格有手指提示', hint6.length > 0, hint6);
      spaceChecked = true;
      await page.keyboard.press('Space');
    } else {
      await page.keyboard.press(w6[i]);
    }
    await sleep(45);
  }
  await sleep(150);
  const prog6 = (await page.locator('#game-progress').textContent()).trim();
  check('按空格能推进，句子能打完', spaceChecked && /^1 \//.test(prog6), prog6);
  check('打完一句后下一目标仍有键高亮', await page.locator('.key.target').count() === 1);
  await page.locator('#btn-quit').click();
  await page.waitForSelector('#screen-menu.active');

  /* ---------- T7 护眼锁定 ---------- */
  console.log('\n[T7] 护眼提醒与键盘锁定');
  await seed(page, FULL_UNLOCK, { eyeMinutes: 0.05 }); // 3 秒
  await page.reload();
  await page.waitForSelector('.level-card');
  await page.locator('.level-card').nth(0).click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  await page.waitForSelector('#eye-modal:not(.hidden)', { timeout: 6000 });
  check('护眼弹窗按时出现', true);
  const t7 = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
  await page.keyboard.press(t7);
  await sleep(80);
  const still = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
  const prog7 = (await page.locator('#game-progress').textContent()).trim();
  check('弹窗期间按键被锁定（不计分）', still === t7 && /^0 \//.test(prog7), prog7);
  await page.locator('#btn-eye-ok').click();
  check('休息后弹窗关闭', await page.locator('#eye-modal.hidden').count() === 1);
  await page.keyboard.press(t7);
  await sleep(80);
  check('恢复后按键生效', /^1 \//.test((await page.locator('#game-progress').textContent()).trim()));

  /* ---------- T8 进度持久化 ---------- */
  console.log('\n[T8] 进度持久化与解锁');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), STORE_KEY);
  check('localStorage 已写入进度', !!saved.progress && !!saved.progress['1-1']);
  await page.reload();
  await page.waitForSelector('.level-card');
  check('刷新后 1-2 已解锁', await page.locator('.level-card').nth(1).evaluate((b) => !b.disabled));

  /* ---------- T9 退出回地图 ---------- */
  console.log('\n[T9] 退出按钮');
  await page.locator('.level-card:not([disabled])').first().click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  await page.locator('#btn-quit').click();
  check('退出回地图', await page.locator('#screen-menu.active').count() === 1);

  /* ---------- T10 存档弹窗与摘要 ---------- */
  console.log('\n[T10] 存档管理弹窗');
  await seed(page, { '1-1': { stars: 3 } });
  await page.reload();
  await page.waitForSelector('.level-card');
  await page.locator('#btn-archive').click();
  check('存档弹窗打开', await page.locator('#archive-modal:not(.hidden)').count() === 1);
  const summary = await page.locator('#archive-summary').textContent();
  check('摘要显示通关与星数', /已通关 1 \/ 29 关 · 共获得 3 颗星/.test(summary), summary.trim());
  const backup = await page.evaluate((key) => {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORE_KEY + '-backup');
  check('自动备份已写入', !!backup && !!backup.savedAt && backup.progress['1-1']);

  /* ---------- T11 主档损坏时从备份恢复 ---------- */
  console.log('\n[T11] 主档损坏自动恢复');
  await page.evaluate((key) => localStorage.removeItem(key), STORE_KEY);
  await page.reload();
  await page.waitForSelector('.level-card');
  check('恢复提示弹出', await page.locator('#restore-toast:not(.hidden)').count() === 1);
  const afterRestore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), STORE_KEY);
  check('主档由备份重建', !!afterRestore.progress && !!afterRestore.progress['1-1']);
  check('恢复后地图显示 3 星', (await page.locator('.level-card').first().textContent()).includes('★★★'));

  /* ---------- T12 导出存档 ---------- */
  console.log('\n[T12] 导出存档');
  await page.locator('#btn-archive').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btn-export').click()
  ]);
  check('下载文件名带日期', /^打字小怪兽存档-\d{8}\.json$/.test(download.suggestedFilename()), download.suggestedFilename());
  const dlPath = await download.path();
  const exported = JSON.parse(require('fs').readFileSync(dlPath, 'utf8'));
  check('导出内容含进度', !!exported.progress && !!exported.progress['1-1']);

  /* ---------- T13 导入存档（含无效文件拒绝） ---------- */
  console.log('\n[T13] 导入存档');
  await seed(page, {}); // 先清成空档
  await page.reload();
  await page.waitForSelector('.level-card');
  const importData = { progress: { '1-1': { stars: 2 }, '1-2': { stars: 1 } }, settings: { sound: false, eyeMinutes: 15 } };
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importData))
  });
  await page.waitForSelector('#restore-toast:not(.hidden)');
  check('导入成功提示', /导入成功/.test(await page.locator('#restore-toast').textContent()));
  const afterImport = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), STORE_KEY);
  check('导入后进度写入', !!afterImport.progress['1-1'] && !!afterImport.progress['1-2']);
  check('导入后 1-2 解锁', await page.locator('.level-card').nth(1).evaluate((b) => !b.disabled));
  /* 无效文件 */
  await page.locator('#btn-archive').click();
  await page.locator('#import-file').setInputFiles({
    name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}')
  });
  await sleep(300);
  check('无效文件被拒绝且有提示', /导入失败/.test(await page.locator('#restore-toast').textContent()));
  const afterBad = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), STORE_KEY);
  check('无效导入不动原进度', !!afterBad.progress['1-1'] && !!afterBad.progress['1-2']);

  /* ---------- T14 自动存档 UI 状态 ---------- */
  console.log('\n[T14] 自动存档区块');
  await seed(page, { '1-1': { stars: 3 } });
  await page.reload();
  await page.waitForSelector('.level-card');
  await page.locator('#btn-archive').click();
  const apiOk = await page.evaluate(() => typeof window.showDirectoryPicker === 'function');
  check('File System Access API 可用（localhost 安全上下文）', apiOk);
  check('自动存档状态显示未开启', (await page.locator('#auto-archive-status').textContent()).trim() === '未开启');
  check('按钮文案为开启', (await page.locator('#btn-auto-archive').textContent()).trim() === '开启自动存档');
  check('按钮可点击', await page.locator('#btn-auto-archive').evaluate((b) => !b.disabled));
  check('自动存档说明文案存在', /自动把存档文件写进去/.test(await page.locator('#archive-modal').textContent()));

  /* ---------- T15 每日目标 ---------- */
  console.log('\n[T15] 每日目标');
  await seed(page, { '1-1': { stars: 3 } }, { dailyMinutes: 10 });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('地图页显示今日目标', /今日目标 0 \/ 10 分钟/.test(await page.locator('#daily-goal-text').textContent()));
  check('皮肤切换器 4 个皮肤', await page.locator('.skin-dot').count() === 4);
  check('莓莓（默认）已选中', await page.locator('.skin-dot.active .skin-dot-name').textContent() === '莓莓');
  /* 打一关，验证活跃时长累计 */
  await page.locator('.level-card:not([disabled])').first().click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  for (let i = 0; i < 12; i++) {
    const tg = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
    await page.keyboard.press(tg);
    await sleep(80);
  }
  await page.waitForSelector('#screen-result:not(.hidden)', { timeout: 4000 });
  const dailyAfter = await page.evaluate((key) => {
    var d = JSON.parse(localStorage.getItem(key) || '{}');
    var days = Object.keys(d.daily || {});
    return days.length ? d.daily[days[0]] : null;
  }, STORE_KEY);
  check('过关后活跃时长已累计', !!dailyAfter && dailyAfter.seconds > 0, dailyAfter ? dailyAfter.seconds + 's' : '无');
  check('当日练习关数 +1', !!dailyAfter && dailyAfter.levels === 1);
  await page.locator('#btn-back-menu').click();
  check('地图页今日进度已更新（进度条有宽度）', await page.locator('#daily-goal-fill').evaluate((el) => parseFloat(el.style.width) > 0));
  const dailyText = await page.locator('#daily-goal-text').textContent();
  check('今日文案已从初始态刷新', /今日目标|吃饱/.test(dailyText), dailyText);

  /* ---------- T16 家长统计页 ---------- */
  console.log('\n[T16] 家长统计页');
  await page.locator('#btn-stats').click();
  check('统计弹窗打开', await page.locator('#stats-modal:not(.hidden)').count() === 1);
  const overview = await page.locator('#stats-overview').textContent();
  check('总览五项数据', /已通关/.test(overview) && /总星星/.test(overview) && /练习天数/.test(overview) && /累计时长/.test(overview) && /今天/.test(overview));
  check('阶段明细 6 行', await page.locator('.stat-stage-row').count() === 6);
  check('热力图键盘渲染', await page.locator('.heat-key').count() >= 40);
  const heatClasses = await page.locator('.heat-key').evaluateAll((els) => els.map((e) => e.className).join(' '));
  check('热力图有着色（有练习过的键）', /h-ok|h-mid|h-bad/.test(heatClasses));
  check('每日目标设置 4 档', await page.locator('.goal-opt').count() === 4);
  check('默认选中 10 分钟', await page.locator('.goal-opt.active').textContent() === '10 分钟');
  /* 切换每日目标 */
  await page.locator('.goal-opt').nth(0).click(); // 5 分钟
  const saved5 = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), STORE_KEY);
  check('每日目标切换为 5 分钟并落档', saved5.settings.dailyMinutes === 5);
  await page.locator('#btn-stats-close').click();
  check('统计弹窗可关闭', await page.locator('#stats-modal.hidden').count() === 1);
  check('地图页目标文案跟随设置', /5 分钟/.test(await page.locator('#daily-goal-text').textContent()));

  /* ---------- T17 皮肤解锁与切换 ---------- */
  console.log('\n[T17] 皮肤系统');
  /* 灌 30 星：解锁莓莓+蓝莓+柠檬，葡萄（45 星）未解锁 */
  await seed(page, {
    '1-1': { stars: 3 }, '1-2': { stars: 3 }, '1-3': { stars: 3 }, '1-4': { stars: 3 }, '1-5': { stars: 3 },
    '1-6': { stars: 3 }, '1-7': { stars: 3 }, '1-8': { stars: 3 }, '2-1': { stars: 2 }, '2-2': { stars: 2 }
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('30 星时葡萄仍锁定', await page.locator('.skin-dot.locked').count() === 1);
  check('锁定皮肤显示所需星数', /45★ 解锁/.test(await page.locator('.skin-dot.locked').textContent()));
  await page.reload();
  await page.waitForSelector('.level-card');
  check('地图页有莓莓预览（所见即所得）', await page.locator('#mascot-mini').count() === 1);
  check('小莓莓初始为莓莓皮肤', await page.locator('#mascot-mini.skin-berry').count() === 1);
  await page.locator('.skin-dot').nth(1).click(); /* 蓝莓 */
  check('切换后莓莓应用蓝莓皮肤', await page.locator('#mascot.skin-blueberry').count() === 1);
  check('切换后小莓莓同步变色', await page.locator('#mascot-mini.skin-blueberry').count() === 1);
  check('皮肤选择落档', await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').settings.skin, STORE_KEY) === 'blueberry');
  check('切换后选中态跟随', await page.locator('.skin-dot.active .skin-dot-name').textContent() === '蓝莓');
  await page.reload();
  await page.waitForSelector('.level-card');
  check('刷新后皮肤保持', await page.locator('#mascot.skin-blueberry').count() === 1);
  /* 点锁定皮肤给提示 */
  await page.locator('.skin-dot.locked').click();
  await page.waitForSelector('#restore-toast:not(.hidden)');
  check('点锁定皮肤提示还差多少星', /再攒 17 颗星/.test(await page.locator('#restore-toast').textContent()));

  /* ---------- T18 旧存档兼容 ---------- */
  console.log('\n[T18] 旧存档兼容（无 daily/heat/settings 新字段）');
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ progress: { '1-1': { stars: 2 } }, settings: { sound: true, eyeMinutes: 15 } }));
  }, STORE_KEY);
  await page.reload();
  await page.waitForSelector('.level-card');
  check('旧档正常载入不报错', await page.locator('.level-card').count() === 29);
  check('旧档星星保留', (await page.locator('.level-card').first().textContent()).includes('★★'));
  check('旧档皮肤默认莓莓', await page.locator('#mascot.skin-berry').count() === 1);
  check('旧档每日目标默认 10 分钟', /10 分钟/.test(await page.locator('#daily-goal-text').textContent()));

  /* ---------- T19 首页星星积分徽章 ---------- */
  console.log('\n[T19] 首页顶部星星积分');
  await seed(page, { '1-1': { stars: 3 }, '1-2': { stars: 2 }, '1-3': { stars: 1 } });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('徽章显示总星星数', (await page.locator('#stars-count').textContent()).trim() === '6');
  check('徽章显示通关进度', (await page.locator('#stars-progress').textContent()).trim() === '通关 3 / 29');
  /* 连备份档一起清才是真新玩家（备份自动恢复机制在起保护作用） */
  await page.evaluate(() => {
    localStorage.removeItem('typing-monster-progress-v1');
    localStorage.removeItem('typing-monster-progress-v1-backup');
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('新玩家徽章为 0', (await page.locator('#stars-count').textContent()).trim() === '0');
  check('新玩家通关 0/29', (await page.locator('#stars-progress').textContent()).trim() === '通关 0 / 29');

  /* ---------- T20 莓莓养成线 ---------- */
  console.log('\n[T20] 莓莓养成线 / 进化解锁皮肤');
  await page.evaluate(() => {
    localStorage.setItem('typing-monster-progress-v1', JSON.stringify({ progress: {}, growth: {}, settings: { sound: false, eyeMinutes: 15 } }));
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('0 星为宝宝形态（g-0）', await page.locator('#mascot-mini.g-0').count() === 1);
  check('宝宝显示呆毛', await page.locator('#mascot-mini .deco-ahoge').evaluate((el) => getComputedStyle(el).display !== 'none'));
  check('成长条显示进化提示', /再喂 10 颗星/.test(await page.locator('#growth-bar').textContent()));
  await page.evaluate(() => {
    const k = 'typing-monster-progress-v1';
    const d = JSON.parse(localStorage.getItem(k));
    for (let i = 1; i <= 8; i++) d.progress['1-' + i] = { stars: 3 }; /* 24 星 */
    d.growth = { celebrated: 1 };
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('24 星仍为 g-1 且不弹进化', await page.locator('#mascot-mini.g-1').count() === 1 && await page.locator('#evo-modal:not(.hidden)').count() === 0);
  await page.evaluate(() => {
    const k = 'typing-monster-progress-v1';
    const d = JSON.parse(localStorage.getItem(k));
    d.progress['2-1'] = { stars: 3 }; /* 27 星 → 跨到 g-2 */
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('跨阶段触发进化庆祝弹窗', await page.locator('#evo-modal:not(.hidden)').count() === 1);
  check('弹窗显示新形态名', /星冠/.test(await page.locator('#evo-name').textContent()));
  check('弹窗提示解锁新衣服', /柠檬/.test(await page.locator('#evo-skin-tip').textContent()));
  await page.locator('#btn-evo-ok').click();
  check('关闭后不再重复弹', await page.locator('#evo-modal:not(.hidden)').count() === 0);
  check('庆祝已写档', (await page.evaluate(() => JSON.parse(localStorage.getItem('typing-monster-progress-v1')).growth.celebrated)) === 2);
  await page.evaluate(() => {
    const k = 'typing-monster-progress-v1';
    const d = JSON.parse(localStorage.getItem(k));
    for (let s = 2; s <= 6; s++) for (let i = 1; i <= 6; i++) d.progress[s + '-' + i] = { stars: 3 }; /* 27+54=81 星 */
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('81 星为星翼形态（g-3）', await page.locator('#mascot-mini.g-3').count() === 1);
  check('星翼显示皇冠与翅膀', await page.locator('#mascot-mini .deco-crown').evaluate((el) => getComputedStyle(el).display !== 'none') && await page.locator('#mascot-mini .deco-wings').evaluate((el) => getComputedStyle(el).display !== 'none'));
  check('满级成长条文案', /完全成长/.test(await page.locator('#growth-bar').textContent()));

  /* ---------- T21 奇遇彩蛋与贴纸图鉴 ---------- */
  console.log('\n[T21] 礼物盒 / 贴纸图鉴');
  await seed(page, { '1-1': { stars: 3 } });
  await page.reload();
  await page.waitForSelector('.level-card');
  /* 强制必掉礼物：stub Math.random */
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('.level-card:not([disabled])').first().click();
  await page.waitForSelector('#target-letter:not(.hidden)');
  /* 按完整关（最多 25 个目标防死循环） */
  for (let i = 0; i < 25; i++) {
    const visible = await page.locator('#screen-result:not(.hidden)').count();
    if (visible) break;
    const tg = (await page.locator('#target-letter').textContent()).trim().toLowerCase();
    await page.keyboard.press(tg);
    await sleep(60);
  }
  await page.waitForSelector('#screen-result:not(.hidden)', { timeout: 4000 });
  check('过关掉落礼物盒', await page.locator('#result-gift:not(.hidden)').count() === 1);
  await page.locator('#btn-gift-open').click();
  await sleep(150);
  check('开盒后显示获得贴纸', /获得贴纸/.test(await page.locator('#gift-hint').textContent()));
  check('开盒按钮变已收好', await page.locator('#btn-gift-open').evaluate((b) => b.disabled));
  const stickers = await page.evaluate(() => JSON.parse(localStorage.getItem('typing-monster-progress-v1')).stickers);
  check('贴纸已写入存档', Object.keys(stickers).length === 1);
  check('重复开盒不重复计（按钮已禁用）', Object.values(stickers)[0] === 1);
  await page.locator('#btn-back-menu').click();
  await page.locator('#btn-book').click();
  check('图鉴弹窗打开', await page.locator('#book-modal:not(.hidden)').count() === 1);
  check('图鉴显示 1 种已收集', /已收集 1 \/ 12/.test(await page.locator('#sticker-progress').textContent()));
  check('图鉴 have 格数正确', await page.locator('.sticker-cell.have').count() === 1);
  check('未收集格显示问号', await page.locator('.sticker-cell:not(.have)').count() === 11);
  await page.locator('#btn-book-close').click();

  /* ---------- T22 冒险路径地图 ---------- */
  console.log('\n[T22] 冒险路径地图');
  await page.evaluate(() => {
    localStorage.setItem('typing-monster-progress-v1', JSON.stringify({
      progress: { '1-1': { stars: 2 }, '1-2': { stars: 3 } },
      growth: { celebrated: 3 },
      settings: { sound: false, eyeMinutes: 15 }
    }));
  });
  await page.reload();
  await page.waitForSelector('.level-card');
  check('已完成关卡插旗', await page.locator('.level-card .lv-flag').count() === 2);
  check('当前关高亮呼吸（current）', await page.locator('.level-card.current').count() === 1);
  check('当前关卡显示出发按钮', /出发/.test(await page.locator('.level-card.current').textContent()));
  check('当前关是第一个未完成关（1-3）', (await page.locator('.level-card.current .lv-name').textContent()) === '左手四兄妹');
  check('偶数节点有下沉起伏', await page.locator('.level-card').nth(1).evaluate((el) => getComputedStyle(el).transform !== 'none'));
  check('虚线连接线存在', await page.locator('.level-card').nth(0).evaluate((el) => getComputedStyle(el, '::before').content !== 'none'));

  /* ---------- T23 触摸设备：点虚拟键盘作答 ---------- */
  console.log('\n[T23] 触摸设备点键作答 / 电脑端不放开');
  const touchCtx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true });
  const tp = await touchCtx.newPage();
  tp.on('pageerror', (e) => { failed++; failures.push('触摸页 JS 错误: ' + e.message); });
  await tp.goto(BASE);
  await tp.evaluate((k) => localStorage.setItem(k, JSON.stringify({ progress: {}, growth: { celebrated: 3 }, settings: { sound: false, eyeMinutes: 15 } })), STORE_KEY);
  await tp.reload();
  await tp.waitForSelector('.level-card');
  check('触摸设备被识别为 coarse 指针', await tp.evaluate(() => matchMedia('(any-pointer: coarse)').matches));
  await tp.locator('.level-card:not([disabled])').first().tap();
  await tp.waitForSelector('#target-letter:not(.hidden)');
  const t23 = (await tp.locator('#target-letter').textContent()).trim().toLowerCase();
  await tp.locator('.key[data-key="' + t23 + '"]').tap({ force: true });
  await sleep(150);
  const p23 = (await tp.locator('#game-progress').textContent()).trim();
  check('点对虚拟键推进进度', /^1 \/ \d+$/.test(p23), p23);
  const cur23 = (await tp.locator('#target-letter').textContent()).trim().toLowerCase();
  await tp.locator('.key[data-key="' + (cur23 === 'q' ? 'w' : 'q') + '"]').tap({ force: true });
  await sleep(150);
  check('点错虚拟键目标不切换', (await tp.locator('#target-letter').textContent()).trim().toLowerCase() === cur23);
  await touchCtx.close();

  const deskCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dp = await deskCtx.newPage();
  await dp.goto(BASE);
  await dp.evaluate((k) => localStorage.setItem(k, JSON.stringify({ progress: {}, growth: { celebrated: 3 }, settings: { sound: false, eyeMinutes: 15 } })), STORE_KEY);
  await dp.reload();
  await dp.waitForSelector('.level-card');
  await dp.locator('.level-card:not([disabled])').first().click();
  await dp.waitForSelector('#target-letter:not(.hidden)');
  const t23b = (await dp.locator('#target-letter').textContent()).trim().toLowerCase();
  await dp.locator('.key[data-key="' + t23b + '"]').click({ force: true });
  await sleep(150);
  check('电脑端鼠标点键不生效（防假练习）', /^0 \/ \d+$/.test((await dp.locator('#game-progress').textContent()).trim()), (await dp.locator('#game-progress').textContent()).trim());
  await deskCtx.close();

  /* ---------- 结果 ---------- */
  await browser.close();
  console.log('\n========== 测试结果 ==========');
  console.log('通过 ' + passed + ' · 失败 ' + failed);
  if (failures.length) { console.log('失败项：'); failures.forEach((f) => console.log('  - ' + f)); process.exit(1); }
  console.log('全部通过');
})().catch((e) => { console.error('测试脚本异常:', e); process.exit(2); });

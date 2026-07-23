import { createRequire } from 'module';
const require = createRequire('/root/.npm/_npx/e41f203b7505f1fb/');
const { chromium } = require('playwright');

const BASE = 'http://localhost:5176/';
const SCREENSHOT_DIR = '/workspace/test-screenshots';
const results = [];

const delay = ms => new Promise(r => setTimeout(r, ms));

async function test(name, fn) {
  try {
    await fn();
    results.push(`PASS ${name}`);
    console.log(`✅ ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message.substring(0, 150)}`);
    console.log(`❌ ${name}: ${e.message.substring(0, 150)}`);
  }
}

async function findAndClick(page, label) {
  const selector = `button[aria-label*="${label}"], button[title*="${label}"]`;
  const btn = page.locator(selector).first();
  await btn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await btn.click({ timeout: 8000 });
  await delay(400);
}

async function getOverlay(page) {
  return page.locator('div[class*="fixed"][class*="inset-0"]').last();
}

async function closeAnyDialog(page) {
  // Try multiple close strategies
  const overlay = await getOverlay(page);
  if (await overlay.isVisible().catch(() => false)) {
    // Strategy 1: click 取消 button
    const cancelBtn = overlay.locator('button:has-text("取消")').first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click().catch(() => {});
      await delay(300);
      return;
    }
    // Strategy 2: click the X close button (first button in header)
    const closeX = overlay.locator('div.flex.items-center button').first();
    if (await closeX.isVisible().catch(() => false)) {
      await closeX.click().catch(() => {});
      await delay(300);
      return;
    }
  }
  // Strategy 3: Escape key
  await page.keyboard.press('Escape').catch(() => {});
  await delay(300);
}

async function ensureEditorFocused(page) {
  // Close any leftover dialog first
  await closeAnyDialog(page);
  // Click editor to ensure focus
  const editor = page.locator('.ProseMirror').first();
  await editor.click().catch(() => {});
  await delay(150);
}

async function clickOk(page, overlay) {
  const okBtn = overlay.locator('button.se-ok-btn').first();
  await okBtn.click({ timeout: 5000 });
  await delay(400);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await delay(3000);
  // Grant clipboard permissions for the page origin
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

  // Setup: clear and type base content
  await findAndClick(page, '清空文档');
  await delay(300);
  const editor = page.locator('.ProseMirror').first();
  await editor.click();
  await page.keyboard.type('SEditor 扩展功能测试文本 ABC abc 123。');
  await delay(300);

  // ===== Copy / Cut / Paste =====
  await test('复制', async () => {
    await page.keyboard.press('Control+a');
    await delay(200);
    await findAndClick(page, '复制');
  });

  await test('粘贴', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await delay(150);
    await findAndClick(page, '粘贴');
    await delay(300);
  });

  await test('剪切', async () => {
    await ensureEditorFocused(page);
    // Use Ctrl+A to guarantee a non-empty selection (cut requires selection)
    await page.keyboard.press('Control+a');
    await delay(300);
    await findAndClick(page, '剪切');
    await delay(300);
  });

  await test('粘贴为纯文本', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await delay(150);
    await findAndClick(page, '粘贴为纯文本');
    await delay(300);
  });

  // ===== Font family / size =====
  await test('字体下拉', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="字体"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    if (!await panel.isVisible().catch(() => false)) throw new Error('字体面板未显示');
    const item = panel.locator('button').nth(1);
    await item.click();
    await delay(300);
  });

  await test('字号下拉', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="字号"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    if (!await panel.isVisible().catch(() => false)) throw new Error('字号面板未显示');
    const item = panel.locator('button').nth(3);
    await item.click();
    await delay(300);
  });

  // ===== Heading =====
  await test('段落格式-标题1', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="段落格式"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button:has-text("标题 1")');
    await item.click();
    await delay(300);
  });

  await test('段落格式-正文', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="段落格式"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button:has-text("正文")');
    await item.click();
    await delay(300);
  });

  // ===== Color / Highlight =====
  await test('文字颜色', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="文字颜色"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const swatch = panel.locator('button[title]').nth(2);
    await swatch.click();
    await delay(300);
  });

  await test('背景色高亮', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="背景色"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const swatch = panel.locator('button[title]').nth(1);
    await swatch.click();
    await delay(300);
  });

  // ===== Subscript / Superscript =====
  await test('下标', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '下标');
  });

  await test('上标', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '上标');
  });

  // Reset
  await ensureEditorFocused(page);
  await findAndClick(page, '下标');
  await findAndClick(page, '上标');

  // ===== Blockquote / Code Block =====
  await test('引用', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await findAndClick(page, '引用');
    await page.keyboard.type('引用内容');
    await delay(300);
  });

  await test('代码块', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('Enter');
    await findAndClick(page, '代码块');
    await page.keyboard.type('const x = 1;');
    await delay(300);
  });

  // ===== Indent / Outdent =====
  await test('增加缩进', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '增加缩进');
  });

  await test('减少缩进', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '减少缩进');
  });

  // ===== Line Height =====
  await test('行距', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="行距"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button').nth(2);
    await item.click();
    await delay(300);
  });

  // ===== Align Justify =====
  await test('两端对齐', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '两端对齐');
  });

  // ===== Paragraph Spacing =====
  await test('段前距', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="段前距"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button').nth(3);
    await item.click();
    await delay(300);
  });

  await test('段后距', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="段后距"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button').nth(3);
    await item.click();
    await delay(300);
  });

  // ===== Text Direction =====
  await test('文字方向', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="文字方向"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const item = panel.locator('button:has-text("从右到左")');
    await item.click();
    await delay(300);
  });

  // ===== Text Case (use exact match to avoid 大写 vs 首字母大写) =====
  await test('字母大小写-大写', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="字母大小写"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    // Use exact text match to distinguish 大写 from 首字母大写
    const item = panel.locator('button', { hasText: /^大写$/ });
    await item.click();
    await delay(300);
  });

  // ===== Character Border =====
  await test('字符边框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '字符边框');
  });

  // ===== Format Painter =====
  await test('格式刷复制', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('Control+a');
    await delay(200);
    await findAndClick(page, '格式刷复制');
  });

  // ===== Table =====
  await test('表格对话框', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await delay(150);
    await findAndClick(page, '表格');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('表格对话框未打开');
    const inputs = overlay.locator('input');
    await inputs.nth(0).fill('3');
    await inputs.nth(1).fill('3');
    await delay(200);
    await clickOk(page, overlay);
    await delay(500);
  });

  // ===== Special Char =====
  await test('特殊字符对话框', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await delay(150);
    await findAndClick(page, '特殊字符');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('特殊字符对话框未打开');
    // Click a character button (those with single-char text)
    const charBtns = overlay.locator('button');
    const count = await charBtns.count();
    if (count > 0) {
      await charBtns.nth(Math.min(5, count - 1)).click().catch(() => {});
    }
    await delay(300);
    await closeAnyDialog(page);
  });

  // ===== Emoji =====
  await test('Emoji对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, 'Emoji');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('Emoji对话框未打开');
    const emojiBtn = overlay.locator('button').first();
    if (await emojiBtn.isVisible().catch(() => false)) {
      await emojiBtn.click().catch(() => {});
    }
    await delay(300);
    await closeAnyDialog(page);
  });

  // ===== Image dialog =====
  await test('图片对话框', async () => {
    await ensureEditorFocused(page);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await delay(150);
    await findAndClick(page, '图片');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('图片对话框未打开');
    const urlInput = overlay.locator('input[type="text"], input:not([type])').first();
    await urlInput.fill('https://via.placeholder.com/100x50.png');
    await delay(500);
    const okBtn = overlay.locator('button.se-ok-btn').first();
    if (await okBtn.isVisible().catch(() => false)) {
      const disabled = await okBtn.isDisabled().catch(() => true);
      if (!disabled) {
        await okBtn.click().catch(() => {});
        await delay(400);
      }
    }
    await closeAnyDialog(page);
  });

  // ===== Remote Image =====
  await test('远程图片对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '远程图片');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('远程图片对话框未打开');
    await closeAnyDialog(page);
  });

  // ===== Video / Audio / File dialogs =====
  await test('视频对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '视频');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('视频对话框未打开');
    await closeAnyDialog(page);
  });

  await test('音频对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '音频');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('音频对话框未打开');
    await closeAnyDialog(page);
  });

  await test('文件对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '文件');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('文件对话框未打开');
    await closeAnyDialog(page);
  });

  // ===== Music / Chart / Graffiti dialogs =====
  await test('音乐对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '音乐');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('音乐对话框未打开');
    await closeAnyDialog(page);
  });

  await test('图表对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '图表');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('图表对话框未打开');
    const okBtn = overlay.locator('button.se-ok-btn').first();
    if (await okBtn.isVisible().catch(() => false)) {
      const disabled = await okBtn.isDisabled().catch(() => true);
      if (!disabled) {
        await okBtn.click().catch(() => {});
        await delay(500);
      }
    }
    await closeAnyDialog(page);
  });

  await test('涂鸦对话框', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '涂鸦');
    await delay(800);
    const overlay = await getOverlay(page);
    if (!await overlay.isVisible().catch(() => false)) throw new Error('涂鸦对话框未打开');
    await closeAnyDialog(page);
  });

  // ===== Template =====
  await test('模板下拉', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="模板"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    if (!await panel.isVisible().catch(() => false)) throw new Error('模板面板未显示');
    const item = panel.locator('button').first();
    await item.click();
    await delay(300);
  });

  // ===== Auto Format =====
  await test('自动排版', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '自动排版');
  });

  // ===== Background Color dropdown =====
  await test('背景色下拉', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="背景色"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    const swatch = panel.locator('button[title]').nth(1);
    await swatch.click();
    await delay(300);
  });

  // ===== Code Language =====
  await test('代码语言下拉', async () => {
    await ensureEditorFocused(page);
    const dd = page.locator('button[aria-label="语言"]');
    await dd.first().click();
    await delay(400);
    const panel = page.locator('.absolute.z-50').last();
    if (!await panel.isVisible().catch(() => false)) throw new Error('代码语言面板未显示');
    const item = panel.locator('button:has-text("JavaScript")');
    await item.click();
    await delay(300);
  });

  // ===== Select All =====
  await test('全选', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '全选');
    await delay(300);
  });

  // ===== Print =====
  await test('打印', async () => {
    await ensureEditorFocused(page);
    await findAndClick(page, '打印');
    await delay(500);
    await page.keyboard.press('Escape').catch(() => {});
    await delay(300);
  });

  // ===== Final screenshot =====
  await page.screenshot({ path: `${SCREENSHOT_DIR}/test-extended-final.png`, fullPage: true });

  console.log('\n========== 扩展测试结果 ==========');
  results.forEach(r => console.log(r));
  const p = results.filter(r => r.startsWith('PASS')).length;
  const f = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n总计: ${p} 通过, ${f} 失败, ${results.length} 项`);

  await browser.close();
}

main().catch(console.error);

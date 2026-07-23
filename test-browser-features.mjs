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
    results.push(`FAIL ${name}: ${e.message.substring(0, 100)}`);
    console.log(`❌ ${name}: ${e.message.substring(0, 100)}`);
  }
}

async function findAndClick(page, label) {
  const selector = `button[aria-label*="${label}"], button[title*="${label}"]`;
  const btn = page.locator(selector).first();
  await btn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await btn.click({ timeout: 8000 });
  await delay(500);
}

async function closeAnyDialog(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await delay(200);
  const dialog = page.locator('.se-dialog-overlay, .se-dialog[style*="block"], [role="dialog"]').last();
  if (await dialog.isVisible().catch(() => false)) {
    const closeBtn = dialog.locator('.se-close, button[aria-label="关闭"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await delay(300);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true })).newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await delay(3000);

  // Clear and type
  await test('清空文档', async () => { await findAndClick(page, '清空文档'); await delay(500); });

  await test('输入文本', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.type('浏览器自动化测试文本内容');
    await delay(500);
  });

  // Formatting
  await test('加粗', async () => {
    await page.keyboard.press('Control+a'); await delay(200);
    await findAndClick(page, '加粗');
  });
  await test('斜体', async () => { await findAndClick(page, '斜体'); });
  await test('下划线', async () => { await findAndClick(page, '下划线'); });
  await test('删除线', async () => { await findAndClick(page, '删除线'); });
  await test('居中', async () => { await findAndClick(page, '居中'); });
  await test('右对齐', async () => { await findAndClick(page, '右对齐'); });
  await test('左对齐', async () => { await findAndClick(page, '左对齐'); });

  // Lists
  await test('无序列表', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await page.keyboard.type('列表项A'); await page.keyboard.press('Enter');
    await page.keyboard.type('列表项B'); await delay(300);
  });
  await test('有序列表', async () => { await findAndClick(page, '有序列表'); });

  // Undo/Redo
  await test('撤销', async () => { await findAndClick(page, '撤销'); });
  await test('重做', async () => { await findAndClick(page, '重做'); });

  // Insert elements
  await test('分割线', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await findAndClick(page, '分割线');
  });
  await test('插入时间', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await findAndClick(page, '插入时间');
  });
  await test('插入日期', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await findAndClick(page, '插入日期');
  });
  await test('分页符', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await findAndClick(page, '分页符');
  });

  // Link dialog - use button click
  await test('超链接对话框', async () => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    await page.keyboard.type('链接文字');
    await delay(200);
    // Select the new text
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+End');
    await delay(200);
    // Click link button
    await findAndClick(page, '超链接');
    await delay(800);
    // Dialog overlay is div.fixed.inset-0
    const overlay = page.locator('div.fixed.inset-0, .se-ok-btn').last();
    if (!await overlay.isVisible().catch(() => false)) throw new Error('对话框未打开');
    // Find input within the overlay
    const overlayDiv = page.locator('div[class*="fixed"][class*="inset-0"]').last();
    const urlInput = overlayDiv.locator('input').first();
    await urlInput.fill('https://www.example.com');
    await delay(300);
    const okBtn = page.locator('.se-ok-btn').last();
    if (await okBtn.isDisabled().catch(() => false)) throw new Error('确定按钮disabled');
    await okBtn.click();
    await delay(500);
  });

  await closeAnyDialog(page);

  // iframe dialog
  await test('iframe对话框', async () => {
    await findAndClick(page, 'iframe');
    await delay(800);
    const okBtn = page.locator('.se-ok-btn').last();
    if (!await okBtn.isVisible().catch(() => false)) throw new Error('对话框未打开');
    const overlayDiv = page.locator('div[class*="fixed"][class*="inset-0"]').last();
    const urlInput = overlayDiv.locator('input').first();
    await urlInput.fill('https://www.example.com');
    await delay(300);
    if (await okBtn.isDisabled().catch(() => false)) throw new Error('确定按钮disabled');
    await okBtn.click();
    await delay(500);
  });

  await closeAnyDialog(page);

  // Anchor dialog
  await test('锚点对话框', async () => {
    await findAndClick(page, '锚点');
    await delay(800);
    const okBtn = page.locator('.se-ok-btn').last();
    if (!await okBtn.isVisible().catch(() => false)) throw new Error('对话框未打开');
    const overlayDiv = page.locator('div[class*="fixed"][class*="inset-0"]').last();
    const nameInput = overlayDiv.locator('input').first();
    await nameInput.fill('test-anchor');
    await delay(300);
    if (await okBtn.isDisabled().catch(() => false)) throw new Error('确定按钮disabled');
    await okBtn.click();
    await delay(500);
  });

  await closeAnyDialog(page);

  // Find and replace - use button click instead of Ctrl+F
  await test('查找替换', async () => {
    await findAndClick(page, '查找替换');
    await delay(800);
    const overlayDiv = page.locator('div[class*="fixed"][class*="inset-0"]').last();
    if (!await overlayDiv.isVisible().catch(() => false)) throw new Error('对话框未打开');
    const inputs = overlayDiv.locator('input[type="text"], input:not([type])');
    await inputs.first().fill('测试');
    await delay(200);
    await inputs.nth(1).fill('TEST');
    await delay(300);
    await overlayDiv.locator('button:has-text("全部替换")').click();
    await delay(500);
    const msg = await overlayDiv.textContent();
    if (!msg.includes('替换')) throw new Error('无替换提示');
    await overlayDiv.locator('button:has-text("取消")').click();
    await delay(300);
  });

  await closeAnyDialog(page);

  // Source code
  await test('源码视图', async () => {
    await findAndClick(page, '源码');
    await delay(800);
    const codeArea = page.locator('textarea, .se-source, pre');
    if (!await codeArea.first().isVisible().catch(() => false)) throw new Error('源码视图未显示');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test-source-code.png` });
    await findAndClick(page, '源码');
    await delay(500);
  });

  // Preview
  await test('预览', async () => {
    await findAndClick(page, '预览');
    await delay(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test-preview.png` });
    await page.keyboard.press('Escape').catch(() => {});
    await delay(300);
    const closeBtn = page.locator('button:has-text("关闭"), .se-preview-close');
    if (await closeBtn.first().isVisible().catch(() => false)) {
      await closeBtn.first().click();
    } else {
      await findAndClick(page, '预览');
    }
    await delay(500);
  });

  // Export Markdown
  await test('导出Markdown', async () => {
    await findAndClick(page, '导出');
    await delay(500);
    const mdBtn = page.locator('button:has-text("Markdown")');
    await mdBtn.first().click({ timeout: 5000 });
    await delay(1000);
  });

  // Fullscreen
  await test('全屏', async () => {
    await findAndClick(page, '全屏');
    await delay(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test-fullscreen.png` });
    await findAndClick(page, '全屏');
    await delay(500);
  });

  // Clear format
  await test('清除格式', async () => {
    await page.locator('.ProseMirror').first().click();
    await page.keyboard.press('Control+a');
    await delay(200);
    await findAndClick(page, '清除格式');
    await delay(500);
  });

  // Word count
  await test('字数统计', async () => {
    const status = await page.locator('.se-statusbar, .se-footer, .se-info-bar').first().textContent().catch(() => '');
    console.log('  状态栏:', (status || '').replace(/\s+/g, ' ').substring(0, 120));
  });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/test-final.png`, fullPage: true });

  console.log('\n========== 测试结果 ==========');
  results.forEach(r => console.log(r));
  const p = results.filter(r => r.startsWith('PASS')).length;
  const f = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n总计: ${p} 通过, ${f} 失败, ${results.length} 项`);

  await browser.close();
}

main().catch(console.error);

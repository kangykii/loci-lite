import { expect, test } from '@playwright/test';

const fixtureUrl = (name: 'empty' | 'lists' | 'references') => `/?case=${name}`;

function expectNoPageErrors() {
  const errors: string[] = [];
  return {
    errors,
    register: (page: import('@playwright/test').Page) => {
      page.on('pageerror', (error) => errors.push(error.message));
    },
  };
}

test('empty placeholder shares the first-line baseline with typed prose', async ({ page }) => {
  const pageErrors = expectNoPageErrors();
  pageErrors.register(page);
  await page.goto(fixtureUrl('empty'), { waitUntil: 'domcontentloaded' });

  const editor = page.getByLabel('Document body');
  const placeholder = page.locator('.editor-placeholder');
  await expect(editor).toBeVisible();
  await expect(placeholder).toBeVisible();
  const placeholderBox = await placeholder.boundingBox();

  await editor.click();
  await page.keyboard.type('First line');
  await expect(placeholder).toBeHidden();
  const typedLineBox = await editor.locator('p').first().boundingBox();

  expect(placeholderBox).not.toBeNull();
  expect(typedLineBox).not.toBeNull();
  expect(Math.abs(placeholderBox!.y - typedLineBox!.y)).toBeLessThan(1);
  expect(pageErrors.errors).toEqual([]);
  await expect(page).toHaveScreenshot('editor-empty.png', { animations: 'disabled' });
});

test('lists stay plain, aligned editor content', async ({ page }) => {
  const pageErrors = expectNoPageErrors();
  pageErrors.register(page);
  await page.goto(fixtureUrl('lists'), { waitUntil: 'domcontentloaded' });

  const listItems = page.getByLabel('Document body').locator('li');
  await expect(listItems).toHaveCount(3);
  const styles = await listItems.evaluateAll((items) =>
    items.map((item) => {
      const style = getComputedStyle(item);
      const rect = item.getBoundingClientRect();
      return {
        background: style.backgroundColor,
        bottom: rect.bottom,
        position: style.position,
        top: rect.top,
        transform: style.transform,
      };
    }),
  );

  for (const [index, style] of styles.entries()) {
    expect(style.background).toBe('rgba(0, 0, 0, 0)');
    expect(style.position).toBe('static');
    expect(style.transform).toBe('none');
    if (index > 0) expect(style.top).toBeGreaterThanOrEqual(styles[index - 1]!.bottom);
  }

  expect(pageErrors.errors).toEqual([]);
  await expect(page).toHaveScreenshot('editor-lists.png', { animations: 'disabled' });
});

test('references are numbered superscripts and stay separate from contents', async ({ page }) => {
  const pageErrors = expectNoPageErrors();
  pageErrors.register(page);
  await page.goto(fixtureUrl('references'), { waitUntil: 'domcontentloaded' });

  const references = page.getByLabel('Document body').locator('.editor-reference');
  await expect(references).toHaveCount(2);
  await expect(references.nth(0)).toHaveText('1');
  await expect(references.nth(1)).toHaveText('2');
  await expect(references.nth(0)).toHaveAttribute('data-reference-number', '1');
  await expect(references.nth(1)).toHaveAttribute('data-reference-number', '2');
  await expect
    .poll(() =>
      references.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node.closest('sup') !== null || getComputedStyle(node).verticalAlign === 'super',
        ),
      ),
    )
    .toBe(true);

  await expect(page.getByRole('navigation', { name: 'References' })).toContainText('1. AGLC4');
  await expect(page.getByRole('navigation', { name: 'References' })).toContainText('2. Authority 2026');
  expect(pageErrors.errors).toEqual([]);
  await expect(page).toHaveScreenshot('editor-references.png', { animations: 'disabled' });

  await page.getByRole('radio', { name: 'Contents' }).click();
  await expect(page.getByRole('navigation', { name: 'Table of contents' })).toContainText('Analysis');
  await expect(page.getByRole('navigation', { name: 'Table of contents' })).not.toContainText('AGLC4');
});

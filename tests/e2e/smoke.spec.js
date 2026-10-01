import { expect, test } from '@playwright/test';

test('app shell renders and resolves a state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '냉장고 지킴이' })).toBeVisible();
  // 환경변수 유무에 따라 설정 안내 또는 로그인 화면 — 어느 쪽이든 로딩에서 벗어나야 한다
  await expect(page.getByText('불러오는 중…')).toBeHidden();
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
});

test('no horizontal scroll on mobile width', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

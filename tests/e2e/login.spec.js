import { expect, test } from '@playwright/test';

// 실제 메일은 보내지 않는다 — 전송 전 검증과 접근성만 확인. 실제 로그인은 /verify-sync에서 사람이 한다.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('불러오는 중…')).toBeHidden();
  const configured = await page.getByRole('heading', { name: '로그인' }).isVisible();
  test.skip(!configured, 'Supabase 미설정 환경(.env 없음)에서는 로그인 화면이 나오지 않음');
});

test('email input has a label and the submit button meets tap size', async ({ page }) => {
  const input = page.getByLabel('이메일');
  await expect(input).toBeVisible();
  const box = await page.getByRole('button', { name: '로그인 링크 보내기' }).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test('invalid email shows a text error without sending', async ({ page }) => {
  let sent = false;
  page.on('request', (req) => {
    if (req.url().includes('/auth/v1/otp')) sent = true;
  });
  await page.getByLabel('이메일').fill('not-an-email');
  await page.getByRole('button', { name: '로그인 링크 보내기' }).click();
  await expect(page.getByText('올바른 이메일 주소를 입력해 주세요')).toBeVisible();
  await expect(page.getByLabel('이메일')).toHaveAttribute('aria-invalid', 'true');
  expect(sent).toBe(false);
});

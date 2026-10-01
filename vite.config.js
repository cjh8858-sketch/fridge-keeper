import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages는 /<repo>/ 하위에 배포되므로 CI에서 VITE_BASE를 주입한다.
  base: process.env.VITE_BASE ?? '/',
  test: {
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.js'],
      // I5: domain 계층은 테스트로 덮는다
      thresholds: { lines: 90, functions: 100, branches: 85 },
    },
  },
});

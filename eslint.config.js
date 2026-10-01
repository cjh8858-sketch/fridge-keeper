// ESLint = 불변식 강제 장치. 에러 메시지는 "에이전트에게 주는 수정 지시"로 쓴다.
// 규칙 근거: docs/core-beliefs.md
import js from '@eslint/js';
import globals from 'globals';

const DOC = 'docs/core-beliefs.md';

/** I6: 날짜 계산은 src/domain/date.js 에서만 */
const DATE_RULES = [
  {
    selector: "NewExpression[callee.name='Date']",
    message: `[I6] new Date()는 src/domain/date.js 안에서만 쓸 수 있습니다. date.js의 today()/addDays()/daysBetween()을 import하세요. (${DOC}#i6)`,
  },
  {
    selector: "CallExpression[callee.object.name='Date']",
    message: `[I6] Date.now()/Date.parse()는 src/domain/date.js 안에서만 쓸 수 있습니다. date.js 함수를 쓰세요. (${DOC}#i6)`,
  },
];

/** I7: 사용자 입력이 HTML로 해석되는 API 금지 */
const XSS_RULES = [
  {
    selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
    message: `[I7] innerHTML/outerHTML 대입 금지(XSS). src/ui/dom.js의 h()로 요소를 만들고 textContent를 쓰세요. (${DOC}#i7)`,
  },
  {
    selector: 'CallExpression[callee.property.name=/^(insertAdjacentHTML|write|writeln)$/]',
    message: `[I7] HTML 문자열 삽입 API 금지(XSS). src/ui/dom.js의 h()를 쓰세요. (${DOC}#i7)`,
  },
];

export default [
  { ignores: ['dist/', 'coverage/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', ...DATE_RULES, ...XSS_RULES],
      // I2: Supabase SDK는 data 계층에서만
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: `[I2] Supabase SDK는 src/data/ 에서만 import합니다. 필요한 기능을 src/data/*-repo.js에 함수로 추가하고 그것을 import하세요. (${DOC}#i2)`,
            },
          ],
        },
      ],
      // I10: 파일은 작게 — 에이전트가 한 번에 읽을 수 있는 크기
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/domain/date.js'],
    rules: { 'no-restricted-syntax': ['error', ...XSS_RULES] },
  },
  {
    files: ['src/data/**/*.js'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

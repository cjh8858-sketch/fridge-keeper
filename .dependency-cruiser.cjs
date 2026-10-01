// I1: 계층 의존 방향 types → domain → data → services → ui (오른쪽이 왼쪽을 import)
// 근거: docs/ARCHITECTURE.md
const fix = (layer, allowed) =>
  `[I1] ${layer}는 ${allowed}만 import할 수 있습니다. 필요한 로직을 아래 계층으로 내리거나, 호출 방향을 뒤집으세요. (docs/ARCHITECTURE.md#계층)`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'types-is-leaf',
      severity: 'error',
      comment: fix('src/types', 'src/types'),
      from: { path: '^src/types/' },
      to: { path: '^src/(domain|data|services|ui)/' },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: fix('src/domain', 'src/types, src/domain'),
      from: { path: '^src/domain/' },
      to: { path: '^src/(data|services|ui)/|node_modules' },
    },
    {
      name: 'data-no-upward',
      severity: 'error',
      comment: fix('src/data', 'src/types, src/domain, src/data'),
      from: { path: '^src/data/' },
      to: { path: '^src/(services|ui)/' },
    },
    {
      name: 'services-no-ui',
      severity: 'error',
      comment: fix('src/services', 'src/types, src/domain, src/data, src/services'),
      from: { path: '^src/services/' },
      to: { path: '^src/ui/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: '[I1] 순환 의존 금지. 공통 부분을 아래 계층으로 분리하세요.',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.test\\.js$' },
  },
};

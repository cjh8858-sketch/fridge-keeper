// 안전한 DOM 생성 헬퍼. I7: 문자열은 항상 textContent로 들어가므로 XSS가 불가능하다.

/**
 * @typedef {Record<string, string | boolean | EventListener | undefined>} Props
 * 'on'으로 시작하는 키는 이벤트 리스너, 나머지는 속성. false/undefined는 생략.
 */

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Props} [props]
 * @param {Array<Node | string | null | undefined | false>} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

/**
 * @param {Element} parent
 * @param {Node} node
 */
export function mount(parent, node) {
  parent.replaceChildren(node);
}

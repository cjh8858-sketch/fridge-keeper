// 가족이 있을 때의 메인: 탭(냉장고 / 추가 / 가족). 모바일은 하단 탭바, PC는 상단.
import { h } from '../dom.js';
import { FamilyView } from './family.js';
import { FridgeView } from './fridge.js';

/**
 * @param {{
 *   household: import('../../types/index.js').Household,
 *   me: import('../../services/session.js').Me,
 *   onChange: () => void,
 * }} props
 * @returns {{ el: HTMLElement, dispose: () => void }} dispose: 실시간 구독 등 정리
 */
export function HomeView({ household, me, onChange }) {
  const fridge = FridgeView({ household, me });
  const content = h('div', { class: 'home-content' });
  /** @type {HTMLElement | null} */
  let family = null;

  /** @param {'fridge' | 'family'} tab */
  function show(tab) {
    for (const b of tabs.querySelectorAll('[data-tab]')) {
      if (b instanceof HTMLElement && b.dataset.tab !== 'add') {
        b.setAttribute('aria-current', String(b.dataset.tab === tab ? 'page' : false));
      }
    }
    if (tab === 'fridge') {
      // 가족 탭에서 돌아올 때만 다시 불러온다 (처음엔 FridgeView가 직접 불러옴)
      const returning = content.firstChild !== null && content.firstChild !== fridge.el;
      content.replaceChildren(fridge.el);
      if (returning) fridge.reload();
    } else {
      family ??= FamilyView({ household, me, onChange });
      content.replaceChildren(family);
    }
  }

  /** @param {string} key @param {string} label @param {() => void} action */
  const tab = (key, label, action) => {
    const b = h('button', { class: 'tab', type: 'button', 'data-tab': key }, [label]);
    b.addEventListener('click', action);
    return b;
  };

  const tabs = h('nav', { class: 'tab-bar', 'aria-label': '메뉴' }, [
    tab('fridge', '냉장고', () => show('fridge')),
    tab('add', '+ 음식 추가', () => {
      show('fridge');
      fridge.openAdd();
    }),
    tab('family', '가족', () => show('family')),
  ]);

  show('fridge');
  return { el: h('div', { class: 'home' }, [tabs, content]), dispose: fridge.dispose };
}

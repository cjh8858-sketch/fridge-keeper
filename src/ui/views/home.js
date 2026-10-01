// 로그인 후 메인: 냉장고 화면 + "음식 추가" 버튼(모바일 하단 고정 = 엄지 영역, PC는 상단).
import { h } from '../dom.js';
import { FridgeView } from './fridge.js';

/**
 * @param {{ me: import('../../services/session.js').Me }} props
 * @returns {{ el: HTMLElement, dispose: () => void }} dispose: 실시간 구독 등 정리
 */
export function HomeView({ me }) {
  const fridge = FridgeView({ me });
  const add = h('button', { class: 'tab', type: 'button', 'data-tab': 'add' }, ['+ 음식 추가']);
  add.addEventListener('click', () => fridge.openAdd());
  const bar = h('nav', { class: 'tab-bar', 'aria-label': '메뉴' }, [add]);
  return { el: h('div', { class: 'home' }, [bar, fridge.el]), dispose: fridge.dispose };
}

// 음식 카드: 이름 · 보관위치 · 수량 · 상태 배지(색+텍스트) · 먹음 버튼. 카드 본문을 누르면 수정.
import { locationLabel } from '../../domain/inventory.js';
import { h } from '../dom.js';

/**
 * @param {{
 *   item: import('../../services/items.js').ItemView,
 *   readOnly?: boolean,
 *   onEdit: () => void,
 *   onConsume: () => void,
 * }} props
 * @returns {HTMLLIElement}
 */
export function ItemCard({ item, readOnly = false, onEdit, onConsume }) {
  const meta = [
    locationLabel(item.location),
    item.quantity > 1 ? `${item.quantity}개` : null,
    item.category,
  ]
    .filter(Boolean)
    .join(' · ');

  const open = h(
    'button',
    { class: 'item-card-main', type: 'button', 'aria-label': `${item.name} 수정` },
    [
      h('span', { class: 'item-card-name' }, [item.name]),
      h('span', { class: 'item-card-meta muted' }, [`${meta} · ${item.expiry_date}`]),
    ],
  );
  open.addEventListener('click', onEdit);
  open.disabled = readOnly;

  const consume = h('button', { class: 'btn btn-quiet btn-small', type: 'button' }, ['먹음']);
  consume.setAttribute('aria-label', `${item.name} 먹음 처리`);
  consume.addEventListener('click', onConsume);
  // 오프라인(읽기 전용)에서는 바꿀 수 없다 — 목록은 계속 보인다
  consume.disabled = readOnly;

  return h('li', { class: 'card item-card', 'data-status': item.status }, [
    open,
    h('span', { class: 'status-badge', 'data-status': item.status }, [item.label]),
    consume,
  ]);
}

// 잠깐 떴다 사라지는 알림 + 선택적 동작 버튼(예: 되돌리기). role="status"로 화면낭독기에도 전달.
import { h } from '../dom.js';

/** @type {HTMLElement | null} */
let current = null;

/**
 * @param {string} message
 * @param {{ actionLabel?: string, onAction?: () => void, durationMs?: number }} [options]
 */
export function showToast(message, { actionLabel, onAction, durationMs = 3000 } = {}) {
  current?.remove();
  const action =
    actionLabel && onAction
      ? h('button', { class: 'btn btn-small toast-action', type: 'button' }, [actionLabel])
      : null;
  const toast = h('div', { class: 'toast', role: 'status' }, [h('span', {}, [message]), action]);
  const timer = setTimeout(() => toast.remove(), durationMs);
  action?.addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
    onAction?.();
  });
  document.body.append(toast);
  current = toast;
}

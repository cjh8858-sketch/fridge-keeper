// 입력 하나 + 제출 버튼 + 메시지 폼. 가족 만들기·코드 참여 등에서 재사용.
// 문서: docs/design-system/components.md (폼 필드, 폼 메시지)
import { h } from '../dom.js';

/**
 * @param {object} options
 * @param {string} options.id input id (label 연결)
 * @param {string} options.label
 * @param {Record<string, string | boolean>} [options.inputProps]
 * @param {string} options.submitLabel
 * @param {string} options.busyLabel
 * @param {string} [options.hint] 처음 표시할 안내 문구
 * @param {(value: string) => Promise<{ ok: true } | { ok: false, message: string }>} options.onSubmit
 * @returns {HTMLFormElement}
 */
export function SingleFieldForm({
  id,
  label,
  inputProps = {},
  submitLabel,
  busyLabel,
  hint = '',
  onSubmit,
}) {
  const messageId = `${id}-message`;
  const input = h('input', {
    id,
    class: 'input',
    required: true,
    'aria-describedby': messageId,
    ...inputProps,
  });
  const button = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [submitLabel]);
  const message = h('p', { id: messageId, class: 'form-message', role: 'status' }, [hint]);

  /** @param {Event} event */
  async function handleSubmit(event) {
    event.preventDefault();
    button.disabled = true;
    button.textContent = busyLabel;
    const result = await onSubmit(input.value);
    // 성공하면 보통 화면이 바뀌어 이 폼은 사라진다
    if (!result.ok) {
      message.textContent = result.message;
      message.dataset.tone = 'error';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
    button.disabled = false;
    button.textContent = submitLabel;
  }

  return h('form', { class: 'stack', novalidate: true, onsubmit: handleSubmit }, [
    h('div', { class: 'field' }, [h('label', { class: 'field-label', for: id }, [label]), input]),
    button,
    message,
  ]);
}

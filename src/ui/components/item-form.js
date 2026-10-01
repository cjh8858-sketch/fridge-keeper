// 음식 추가/수정 폼. 필드별 오류를 텍스트로 표시(aria-invalid + 메시지). 스펙: docs/product-specs/items.md
import { addDays } from '../../domain/date.js';
import { LIMITS, LOCATIONS, QUICK_EXPIRY_DAYS } from '../../domain/inventory.js';
import { h } from '../dom.js';

/**
 * @typedef {object} ItemFormProps
 * @property {string} todayDate 빠른 선택 기준일 (기기 시간대)
 * @property {import('../../types/index.js').Item} [item] 있으면 수정 모드
 * @property {(input: import('../../domain/inventory.js').ItemInput) =>
 *   Promise<{ ok: true } | { ok: false, message?: string, errors?: Record<string, string> }>} onSave
 * @property {() => void} onCancel
 * @property {() => Promise<void>} [onDelete] 수정 모드에서만
 */

/** @param {string} id @param {string} label @param {HTMLElement} control */
function field(id, label, control) {
  const error = h('p', { id: `${id}-error`, class: 'form-message', 'data-tone': 'error' });
  control.setAttribute('aria-describedby', `${id}-error`);
  return {
    el: h('div', { class: 'field' }, [
      h('label', { class: 'field-label', for: id }, [label]),
      control,
      error,
    ]),
    error,
    control,
  };
}

/**
 * @param {ItemFormProps} props
 * @returns {HTMLFormElement}
 */
export function ItemForm({ todayDate, item, onSave, onCancel, onDelete }) {
  const editing = Boolean(item);
  const name = field(
    'item-name',
    '이름',
    h('input', {
      id: 'item-name',
      class: 'input',
      type: 'text',
      maxlength: String(LIMITS.name),
      placeholder: '예: 우유',
      autocomplete: 'off',
      required: true,
    }),
  );
  const expiryInput = h('input', {
    id: 'item-expiry',
    class: 'input',
    type: 'date',
    required: true,
  });
  const expiry = field('item-expiry', '유통기한', expiryInput);
  const quick = h(
    'div',
    { class: 'button-row', role: 'group', 'aria-label': '유통기한 빠른 선택' },
    QUICK_EXPIRY_DAYS.map((days) => {
      const b = h('button', { class: 'btn btn-quiet btn-small', type: 'button' }, [`+${days}일`]);
      b.addEventListener('click', () => {
        expiryInput.value = addDays(todayDate, days);
      });
      return b;
    }),
  );

  const locationGroup = h(
    'div',
    { class: 'segmented', role: 'radiogroup', 'aria-labelledby': 'item-location-label' },
    LOCATIONS.map((loc) =>
      h('label', { class: 'segmented-option' }, [
        h('input', { type: 'radio', name: 'location', value: loc.value }),
        h('span', {}, [loc.label]),
      ]),
    ),
  );
  const locationError = h('p', { class: 'form-message', 'data-tone': 'error' });

  const quantity = field(
    'item-quantity',
    '수량',
    h('input', {
      id: 'item-quantity',
      class: 'input',
      type: 'number',
      min: '1',
      max: String(LIMITS.quantity),
      step: '1',
      inputmode: 'numeric',
    }),
  );
  const category = field(
    'item-category',
    '분류 (선택)',
    h('input', {
      id: 'item-category',
      class: 'input',
      type: 'text',
      maxlength: String(LIMITS.category),
      placeholder: '예: 유제품',
    }),
  );
  const memo = field(
    'item-memo',
    '메모 (선택)',
    h('textarea', { id: 'item-memo', class: 'input', rows: '2', maxlength: String(LIMITS.memo) }),
  );

  const status = h('p', { class: 'form-message', role: 'status' });
  const submit = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [
    editing ? '저장' : '추가',
  ]);
  const cancel = h('button', { class: 'btn btn-quiet', type: 'button' }, ['취소']);
  cancel.addEventListener('click', onCancel);
  const del =
    editing && onDelete
      ? h('button', { class: 'btn btn-quiet btn-danger', type: 'button' }, ['삭제'])
      : null;
  del?.addEventListener('click', async () => {
    if (window.confirm(`'${item?.name}'을(를) 삭제할까요? 먹은 경우엔 "먹음"을 눌러주세요.`))
      await onDelete?.();
  });

  // 초기값
  const n = /** @type {HTMLInputElement} */ (name.control);
  const q = /** @type {HTMLInputElement} */ (quantity.control);
  const c = /** @type {HTMLInputElement} */ (category.control);
  const m = /** @type {HTMLTextAreaElement} */ (memo.control);
  n.value = item?.name ?? '';
  expiryInput.value = item?.expiry_date ?? '';
  q.value = String(item?.quantity ?? 1);
  c.value = item?.category ?? '';
  m.value = item?.memo ?? '';
  const initialLocation = item?.location ?? 'fridge';
  for (const r of locationGroup.querySelectorAll('input')) r.checked = r.value === initialLocation;

  /** @type {Record<string, { error: HTMLElement, control: HTMLElement }>} */
  const fields = { name, expiry_date: expiry, quantity, category, memo };

  /** @param {Record<string, string>} errors */
  function showErrors(errors) {
    for (const [key, f] of Object.entries(fields)) {
      f.error.textContent = errors[key] ?? '';
      f.control.setAttribute('aria-invalid', String(Boolean(errors[key])));
    }
    locationError.textContent = errors.location ?? '';
    const firstKey = Object.keys(fields).find((k) => errors[k]);
    if (firstKey) fields[firstKey].control.focus();
  }

  /** @param {Event} event */
  async function handleSubmit(event) {
    event.preventDefault();
    submit.disabled = true;
    const checked = /** @type {HTMLInputElement | null} */ (
      locationGroup.querySelector('input:checked')
    );
    const result = await onSave({
      name: n.value,
      expiry_date: expiryInput.value,
      location: checked?.value ?? '',
      quantity: q.value,
      category: c.value,
      memo: m.value,
    });
    submit.disabled = false;
    if (result.ok) return;
    showErrors(result.errors ?? {});
    status.textContent = result.message ?? '';
    status.dataset.tone = 'error';
  }

  return h('form', { class: 'stack item-form', novalidate: true, onsubmit: handleSubmit }, [
    h('h2', {}, [editing ? '음식 수정' : '음식 추가']),
    name.el,
    h('div', { class: 'stack-tight' }, [expiry.el, quick]),
    h('div', { class: 'field' }, [
      h('span', { id: 'item-location-label', class: 'field-label' }, ['보관 위치']),
      locationGroup,
      locationError,
    ]),
    quantity.el,
    h('details', { class: 'more', open: Boolean(item?.category || item?.memo) }, [
      h('summary', {}, ['분류·메모 더 보기']),
      category.el,
      memo.el,
    ]),
    submit,
    h('div', { class: 'button-row' }, [cancel, del]),
    status,
  ]);
}

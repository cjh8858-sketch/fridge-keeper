// 가족이 없을 때: 새로 만들기 또는 초대코드로 참여. 스펙: docs/product-specs/family-sharing.md
import { HOUSEHOLD_NAME_MAX } from '../../domain/validation.js';
import { createFamily, joinFamily } from '../../services/household.js';
import { SingleFieldForm } from '../components/single-field-form.js';
import { h } from '../dom.js';

/**
 * @param {{ onDone: () => void }} props 가족 생성/참여 성공 시 호출 (앱 상태 다시 읽기)
 * @returns {HTMLElement}
 */
export function HouseholdSetupView({ onDone }) {
  /** @param {{ ok: true } | { ok: false, message: string }} result */
  const afterSubmit = (result) => {
    if (result.ok) onDone();
    return result;
  };

  const create = SingleFieldForm({
    id: 'household-name',
    label: '가족 이름',
    inputProps: {
      type: 'text',
      maxlength: String(HOUSEHOLD_NAME_MAX),
      placeholder: '예: 우리집',
      autocomplete: 'off',
    },
    submitLabel: '가족 만들기',
    busyLabel: '만드는 중…',
    hint: '만든 사람이 관리자가 되고, 초대코드로 가족을 부를 수 있어요.',
    onSubmit: async (value) => afterSubmit(await createFamily(value)),
  });

  const join = SingleFieldForm({
    id: 'invite-code',
    label: '초대코드',
    inputProps: {
      type: 'text',
      class: 'input input-code',
      maxlength: '9',
      placeholder: '8자리 코드',
      autocomplete: 'off',
      autocapitalize: 'characters',
      spellcheck: 'false',
    },
    submitLabel: '가족 참여하기',
    busyLabel: '확인하는 중…',
    hint: '가족에게 받은 8자리 코드를 입력하세요.',
    onSubmit: async (value) => afterSubmit(await joinFamily(value)),
  });

  return h('div', { class: 'stack setup' }, [
    h('section', { class: 'card stack', 'aria-labelledby': 'create-title' }, [
      h('h2', { id: 'create-title' }, ['새 가족 만들기']),
      create,
    ]),
    h('p', { class: 'divider', role: 'separator' }, ['또는']),
    h('section', { class: 'card stack', 'aria-labelledby': 'join-title' }, [
      h('h2', { id: 'join-title' }, ['초대코드로 참여하기']),
      join,
    ]),
  ]);
}

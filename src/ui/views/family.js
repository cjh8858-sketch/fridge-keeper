// 우리 가족: 구성원 목록, 초대코드 만들기·복사·공유, 나가기/내보내기. 스펙: docs/product-specs/family-sharing.md
import {
  avatarInitial,
  INVITE_VALID_DAYS,
  loadMembers,
  makeInviteCode,
  removeFromFamily,
} from '../../services/household.js';
import { h } from '../dom.js';

/**
 * @param {{
 *   household: import('../../types/index.js').Household,
 *   me: import('../../services/session.js').Me,
 *   onChange: () => void,
 * }} props onChange: 나가기 등으로 앱 상태가 바뀌었을 때
 * @returns {HTMLElement}
 */
export function FamilyView({ household, me, onChange }) {
  const memberList = h('ul', { class: 'member-list', 'aria-label': '구성원' }, [
    h('li', { class: 'muted' }, ['구성원을 불러오는 중…']),
  ]);
  const memberCount = h('p', { class: 'muted' }, ['']);
  const status = h('p', { class: 'form-message', role: 'status' }, ['']);
  const footer = h('div', { class: 'stack' });

  /** @param {string} text @param {'info' | 'error' | 'success'} tone */
  function say(text, tone) {
    status.textContent = text;
    status.dataset.tone = tone;
  }

  async function renderMembers() {
    try {
      const { members, iAmOwner } = await loadMembers(household.id, me.userId);
      memberCount.textContent = `구성원 ${members.length}명`;
      memberList.replaceChildren(
        ...members.map((m) => {
          const kick =
            iAmOwner && !m.isMe
              ? h('button', { class: 'btn btn-quiet btn-small', type: 'button' }, ['내보내기'])
              : null;
          kick?.addEventListener('click', async () => {
            if (!window.confirm(`${m.email} 님을 가족에서 내보낼까요?`)) return;
            const result = await removeFromFamily(household.id, m.user_id);
            if (result.ok) renderMembers();
            else say(result.message, 'error');
          });
          return h('li', { class: 'member' }, [
            h('span', { class: 'avatar', 'aria-hidden': 'true' }, [avatarInitial(m.email)]),
            h('span', { class: 'member-email' }, [m.email, m.isMe ? ' (나)' : '']),
            m.role === 'owner' ? h('span', { class: 'role-badge' }, ['관리자']) : null,
            kick,
          ]);
        }),
      );
      footer.replaceChildren(...(iAmOwner ? [] : [LeaveButton()]));
    } catch {
      memberList.replaceChildren(h('li', {}, ['구성원 목록을 불러오지 못했습니다.']));
    }
  }

  function LeaveButton() {
    const button = h('button', { class: 'btn btn-quiet', type: 'button' }, ['가족 나가기']);
    button.addEventListener('click', async () => {
      if (
        !window.confirm(
          `'${household.name}' 가족에서 나갈까요? 공유된 음식 목록을 더 볼 수 없습니다.`,
        )
      )
        return;
      const result = await removeFromFamily(household.id, me.userId);
      if (result.ok) onChange();
      else say(result.message, 'error');
    });
    return button;
  }

  renderMembers();

  return h('div', { class: 'stack' }, [
    h('section', { class: 'card stack', 'aria-labelledby': 'family-title' }, [
      h('div', {}, [h('h2', { id: 'family-title' }, [household.name]), memberCount]),
      memberList,
      footer,
    ]),
    InviteSection({ householdId: household.id }),
    status,
  ]);
}

/**
 * 초대코드 만들기 → 큰 글씨 코드 + 복사/공유
 * @param {{ householdId: string }} props
 */
function InviteSection({ householdId }) {
  const make = h('button', { class: 'btn btn-primary btn-block', type: 'button' }, [
    '초대코드 만들기',
  ]);
  const result = h('div', { class: 'stack', 'aria-live': 'polite' });
  const message = h('p', { class: 'form-message', role: 'status' }, [
    `가족에게 코드를 보내면 ${INVITE_VALID_DAYS}일 동안 참여할 수 있어요.`,
  ]);

  make.addEventListener('click', async () => {
    make.disabled = true;
    make.textContent = '만드는 중…';
    const res = await makeInviteCode(householdId);
    make.disabled = false;
    make.textContent = '새 코드 만들기';
    if (!res.ok) {
      message.textContent = res.message;
      message.dataset.tone = 'error';
      return;
    }
    const copy = h('button', { class: 'btn btn-quiet', type: 'button' }, ['복사']);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(res.code);
        message.textContent = '코드를 복사했습니다. 메신저에 붙여넣어 보내세요.';
        message.dataset.tone = 'success';
      } catch {
        message.textContent = '복사하지 못했습니다. 코드를 직접 길게 눌러 복사해 주세요.';
        message.dataset.tone = 'error';
      }
    });
    const share =
      typeof navigator.share === 'function'
        ? h('button', { class: 'btn btn-quiet', type: 'button' }, ['공유'])
        : null;
    share?.addEventListener('click', () => {
      navigator.share({ text: `냉장고 지킴이 가족 초대코드: ${res.code}` }).catch(() => {}); // 사용자가 공유 창을 닫은 경우
    });
    result.replaceChildren(
      h('p', { class: 'invite-code', 'aria-label': `초대코드 ${res.code.split('').join(' ')}` }, [
        res.code,
      ]),
      h('div', { class: 'button-row' }, [copy, share]),
    );
    message.textContent = `${INVITE_VALID_DAYS}일 동안 사용할 수 있어요.`;
    message.dataset.tone = 'info';
  });

  return h('section', { class: 'card stack', 'aria-labelledby': 'invite-title' }, [
    h('h2', { id: 'invite-title' }, ['가족 초대하기']),
    result,
    make,
    message,
  ]);
}

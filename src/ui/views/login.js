// 로그인 화면: 이메일 입력 → 매직링크 전송 → 메일 확인 안내. 스펙: docs/product-specs/auth.md
import { RESEND_COOLDOWN_SECONDS, requestLoginLink } from '../../services/auth.js';
import { h } from '../dom.js';

/** 링크를 눌렀을 때 돌아올 주소 (GitHub Pages 하위 경로 포함) */
function appUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

/** @returns {HTMLElement} */
export function LoginView() {
  const input = h('input', {
    id: 'login-email',
    class: 'input',
    type: 'email',
    name: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    placeholder: 'name@example.com',
    required: true,
    'aria-describedby': 'login-message',
  });
  const button = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [
    '로그인 링크 보내기',
  ]);
  const message = h('p', { id: 'login-message', class: 'form-message', role: 'status' }, [
    '비밀번호 없이, 메일로 받은 링크를 누르면 로그인됩니다.',
  ]);

  /** @param {string} text @param {'info' | 'error' | 'success'} tone */
  function setMessage(text, tone) {
    message.textContent = text;
    message.dataset.tone = tone;
    input.setAttribute('aria-invalid', String(tone === 'error'));
  }

  /** 재전송 대기: 남은 초를 버튼에 표시하고 끝나면 다시 활성화 */
  function startCooldown() {
    let left = RESEND_COOLDOWN_SECONDS;
    button.disabled = true;
    button.textContent = `다시 보내기 (${left}초)`;
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0 && button.isConnected) {
        button.textContent = `다시 보내기 (${left}초)`;
        return;
      }
      clearInterval(timer);
      button.disabled = false;
      button.textContent = '링크 다시 보내기';
    }, 1000);
  }

  /** @param {Event} event */
  async function onSubmit(event) {
    event.preventDefault();
    button.disabled = true;
    button.textContent = '보내는 중…';
    const result = await requestLoginLink(input.value, appUrl());
    if (result.ok) {
      setMessage(
        `${result.email} 로 로그인 링크를 보냈습니다. 메일함(안 보이면 스팸함)에서 링크를 눌러주세요. 다른 기기에서 열어도 됩니다.`,
        'success',
      );
      startCooldown();
    } else {
      setMessage(result.message, 'error');
      button.disabled = false;
      button.textContent = '로그인 링크 보내기';
      input.focus();
    }
  }

  const form = h('form', { class: 'stack', novalidate: true, onsubmit: onSubmit }, [
    h('div', { class: 'field' }, [
      h('label', { class: 'field-label', for: 'login-email' }, ['이메일']),
      input,
    ]),
    button,
    message,
  ]);

  return h('section', { class: 'card stack login', 'aria-labelledby': 'login-title' }, [
    h('h2', { id: 'login-title' }, ['로그인']),
    form,
  ]);
}

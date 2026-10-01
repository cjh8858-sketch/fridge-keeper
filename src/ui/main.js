// 앱 진입점. 상태(AppState)에 따라 화면을 고른다. 화면 구현은 docs/exec-plans/active/ 계획대로 채운다.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import { isConfigured } from '../data/supabase-client.js';
import { logout, watchAuth } from '../services/auth.js';
import { resolveAppState } from '../services/session.js';
import { h, mount } from './dom.js';
import { registerServiceWorker } from './pwa.js';
import { HomeView } from './views/home.js';
import { LoginView } from './views/login.js';

const APP_NAME = '냉장고 지킴이';

/** @param {string} title @param {string} body */
function notice(title, body) {
  return h('section', { class: 'card notice' }, [h('h2', {}, [title]), h('p', {}, [body])]);
}

/**
 * @param {import('../services/session.js').AppState} state
 * @returns {{ el: HTMLElement, dispose?: () => void }}
 */
function renderState(state) {
  switch (state.kind) {
    case 'unconfigured':
      return {
        el: notice(
          'Supabase 설정이 필요합니다',
          '.env.example을 .env로 복사하고 값을 채운 뒤 다시 실행하세요. (docs/references/supabase-setup.md)',
        ),
      };
    case 'signed-out':
      return { el: LoginView() };
    case 'ready':
      return HomeView({ me: state.me });
  }
}

/**
 * 로그인 상태면 이메일 + 로그아웃 버튼
 * @param {import('../services/session.js').AppState} state
 */
function renderAccount(state) {
  if (state.kind !== 'ready') return null;
  const button = h('button', { class: 'btn btn-quiet', type: 'button' }, ['로그아웃']);
  button.addEventListener('click', async () => {
    button.disabled = true;
    await logout(); // watchAuth가 화면을 다시 그린다
  });
  return h('div', { class: 'account' }, [
    h('span', { class: 'account-email muted' }, [state.me.email]),
    button,
  ]);
}

function start() {
  const root = document.getElementById('app');
  if (!root) return;
  const account = h('div', { class: 'app-header-actions' });
  const view = h('div', { id: 'view' }, [h('p', { class: 'muted' }, ['불러오는 중…'])]);
  mount(
    root,
    h('main', { class: 'app-shell' }, [
      h('header', { class: 'app-header' }, [h('h1', {}, [APP_NAME]), account]),
      view,
    ]),
  );

  // 로그인/로그아웃이 연달아 일어나도 마지막 결과만 그린다
  let renderId = 0;
  /** 이전 화면의 정리 함수 (실시간 구독 해제 등) */
  let cleanup = () => {};
  async function refresh() {
    const id = ++renderId;
    try {
      const state = await resolveAppState();
      if (id !== renderId) return;
      account.replaceChildren(...[renderAccount(state)].filter((n) => n !== null));
      cleanup();
      const next = renderState(state);
      cleanup = next.dispose ?? (() => {});
      mount(view, next.el);
    } catch (err) {
      if (id !== renderId) return;
      mount(view, notice('문제가 발생했습니다', err instanceof Error ? err.message : String(err)));
    }
  }

  refresh();
  if (isConfigured()) watchAuth(refresh);
}

start();
registerServiceWorker();

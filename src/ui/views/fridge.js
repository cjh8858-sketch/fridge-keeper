// 냉장고 화면: 상단 요약 · 보관위치 필터 · 급한 순 목록 · 추가/수정 패널.
// 모바일: 패널은 하단 시트(열 때만), PC: 오른쪽 열에 항상 표시. 스펙: docs/product-specs/items.md
import { filterByLocation, LOCATIONS } from '../../domain/inventory.js';
import {
  consumeItem,
  loadFridge,
  removeItem,
  saveItem,
  undoConsume,
} from '../../services/items.js';
import { READ_ONLY_LABEL, SYNC_LABELS, watchItems } from '../../services/sync.js';
import { ItemCard } from '../components/item-card.js';
import { ItemForm } from '../components/item-form.js';
import { showToast } from '../components/toast.js';
import { h } from '../dom.js';

const SUMMARY = /** @type {const} */ ([
  ['expired', '지남'],
  ['today', '오늘'],
  ['soon', '임박'],
]);

/**
 * @param {{
 *   household: import('../../types/index.js').Household,
 *   me: import('../../services/session.js').Me,
 * }} props
 * @returns {{ el: HTMLElement, openAdd: () => void, reload: () => Promise<void>, dispose: () => void }}
 */
export function FridgeView({ household, me }) {
  /** @type {import('../../types/index.js').StorageLocation | 'all'} */
  let filter = 'all';
  /** @type {Awaited<ReturnType<typeof loadFridge>> | null} */
  let data = null;
  /** 오프라인(네트워크 끊김 또는 캐시 표시 중)이면 읽기 전용 (M6) */
  let readOnly = false;

  const summary = h('p', { class: 'summary', 'aria-live': 'polite' });
  // 동기화 상태: 점(색) + 텍스트. 상태가 바뀔 때마다 낭독하면 시끄러우므로 aria-live 없음
  const sync = h('p', { class: 'sync-indicator', 'data-status': 'connecting' }, [
    SYNC_LABELS.connecting,
  ]);
  const list = h('ul', { class: 'item-list', 'aria-label': '음식 목록' }, [
    h('li', { class: 'muted' }, ['불러오는 중…']),
  ]);
  const panel = h('aside', { class: 'fridge-panel card', 'aria-label': '음식 추가/수정' });

  const chips = h(
    'div',
    { class: 'chip-row', role: 'group', 'aria-label': '보관 위치 필터' },
    [{ value: 'all', label: '전체' }, ...LOCATIONS].map(({ value, label }) => {
      const chip = h(
        'button',
        { class: 'chip', type: 'button', 'aria-pressed': String(value === filter) },
        [label],
      );
      chip.addEventListener('click', () => {
        filter = /** @type {typeof filter} */ (value);
        for (const c of chips.children) c.setAttribute('aria-pressed', String(c === chip));
        renderList();
      });
      return chip;
    }),
  );

  /** 읽기 전용 여부를 다시 계산해 패널·카드·상태 표시에 반영 */
  function applyMode() {
    const next = !navigator.onLine || Boolean(data?.offline);
    const changed = next !== readOnly;
    readOnly = next;
    if (readOnly) {
      sync.dataset.status = 'offline';
      sync.textContent = data?.cachedAt
        ? `${READ_ONLY_LABEL} (${data.cachedAt} 기준)`
        : READ_ONLY_LABEL;
    }
    if (!changed) return;
    panel.dataset.open = 'false';
    if (readOnly) {
      panel.replaceChildren(
        h('p', { class: 'muted' }, ['오프라인에서는 추가·수정할 수 없어요. 연결되면 다시 열려요.']),
      );
    } else {
      renderForm();
    }
    renderList();
  }

  function renderList() {
    if (!data) return;
    const s = data.summary;
    summary.textContent = SUMMARY.map(([key, label]) => `${label} ${s[key]}`).join(' · ');
    summary.dataset.alert = String(s.expired + s.today > 0);
    const items = filterByLocation(data.items, filter);
    if (items.length === 0) {
      list.replaceChildren(
        h('li', { class: 'empty-state' }, [
          data.items.length === 0
            ? '아직 등록된 음식이 없어요. "음식 추가"로 첫 음식을 넣어보세요.'
            : '이 보관 위치에는 음식이 없어요.',
        ]),
      );
      return;
    }
    list.replaceChildren(
      ...items.map((item) =>
        ItemCard({ item, readOnly, onEdit: () => openForm(item), onConsume: () => consume(item) }),
      ),
    );
  }

  async function reload() {
    try {
      data = await loadFridge(household, me.userId);
      renderList();
      applyMode();
    } catch {
      list.replaceChildren(
        h('li', { class: 'empty-state' }, ['목록을 불러오지 못했습니다. 새로고침해 주세요.']),
      );
    }
  }

  /** @param {import('../../services/items.js').ItemView} item */
  async function consume(item) {
    if (readOnly) return showToast('오프라인에서는 바꿀 수 없어요.');
    const result = await consumeItem(item.id);
    if (!result.ok) return showToast(result.message);
    await reload();
    showToast(`'${item.name}' 먹음 처리했어요.`, {
      actionLabel: '되돌리기',
      onAction: async () => {
        const undo = await undoConsume(item.id);
        if (!undo.ok) showToast(undo.message);
        await reload();
      },
    });
  }

  /** @param {import('../../types/index.js').Item} [item] */
  function renderForm(item) {
    // 닫기 = 빈 추가 폼으로 되돌리기 (PC에서는 계속 보이고, 모바일에서는 시트가 닫힌다)
    const close = () => {
      renderForm();
      panel.dataset.open = 'false';
    };
    panel.replaceChildren(
      ItemForm({
        todayDate: data?.todayDate ?? '',
        item,
        onCancel: close,
        onSave: async (input) => {
          const result = await saveItem(household.id, input, item?.id);
          if (result.ok) {
            showToast(item ? '저장했어요.' : `'${input.name.trim()}' 추가했어요.`);
            close();
            await reload();
          }
          return result;
        },
        onDelete: item
          ? async () => {
              const result = await removeItem(item.id);
              showToast(result.ok ? '삭제했어요.' : result.message);
              if (result.ok) {
                close();
                await reload();
              }
            }
          : undefined,
      }),
    );
  }

  /**
   * 사용자가 추가/수정을 눌렀을 때: 폼을 열고 첫 입력에 포커스
   * @param {import('../../types/index.js').Item} [item]
   */
  function openForm(item) {
    if (readOnly) {
      showToast('오프라인에서는 추가·수정할 수 없어요.');
      return;
    }
    renderForm(item);
    panel.dataset.open = 'true';
    panel.querySelector('input')?.focus({ preventScroll: true });
  }

  panel.dataset.open = 'false';
  renderForm();
  reload().then(() => {
    // todayDate가 생긴 뒤 빠른 선택이 동작하도록 빈 폼을 다시 만든다
    if (panel.dataset.open === 'false') {
      renderForm();
    }
  });

  // ── 실시간 동기화 (M5) ──
  /** @param {import('../../services/sync.js').SyncStatus} status */
  function setSync(status) {
    sync.dataset.status = status;
    sync.textContent = SYNC_LABELS[status];
    applyMode(); // 오프라인이면 표시를 "읽기 전용 (… 기준)"으로 덮어쓴다
  }
  /**
   * 실시간 채널이 마지막으로 알려준 상태 — 브라우저 offline/online 이벤트와 구분해 기억한다
   * @type {import('../../services/sync.js').SyncStatus}
   */
  let channelStatus = 'connecting';
  const stopWatching = watchItems(household.id, {
    onChange: () => reload(),
    onStatus: (status) => {
      channelStatus = status;
      setSync(status);
    },
  });
  // 휴대폰은 화면이 꺼지면 연결이 끊기므로 돌아오거나 온라인이 되면 한 번 다시 불러온다
  const onVisible = () => {
    if (document.visibilityState === 'visible') reload();
  };
  const onOnline = () => {
    // 채널이 실제로 끊겼다면 재연결 시 새 상태가 오고, 짧은 끊김이면 기존 상태가 그대로 맞다
    setSync(channelStatus);
    reload();
  };
  const onOffline = () => setSync('offline');
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  function dispose() {
    stopWatching();
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  }

  const el = h('div', { class: 'fridge' }, [
    h('section', { class: 'fridge-main stack', 'aria-labelledby': 'fridge-title' }, [
      h('div', {}, [h('h2', { id: 'fridge-title' }, [household.name]), summary, sync]),
      chips,
      list,
    ]),
    panel,
  ]);
  return { el, openAdd: () => openForm(), reload, dispose };
}

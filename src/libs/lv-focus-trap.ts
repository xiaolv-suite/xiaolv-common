/**
 * 小驴生态通用焦点陷阱与循环管理工具 (LvFocusTrap)
 * Protocol: Lv-Ergonomics-v1.0.0
 * 
 * 职责：
 * 1. 将键盘 Tab / Shift+Tab 导航限制在当前弹窗/面板容器内，杜绝焦点穿透到背后的思源文档与外壳。
 * 2. 支持弹窗关闭时自动毫秒级归还原先的触发元素焦点 (restoreFocus)。
 * 3. 支持多层弹窗/子面板的 LIFO 栈式激活与恢复。
 * 4. 零外部依赖，纯 TypeScript 实现，具备完善的环境探测与测试隔离。
 */

export interface FocusTrapOptions {
  /** 初始聚焦的选择器或元素（默认聚焦首个可聚焦元素） */
  initialFocus?: HTMLElement | string | null;
  /** 关闭后是否将焦点归还给原触发元素，默认 true */
  restoreFocus?: boolean;
  /** 是否在捕获阶段监听按键事件 */
  capture?: boolean;
  /** 允许在没有可聚焦元素时退化到容器自身获得焦点 */
  fallbackToContainer?: boolean;
}

export interface FocusTrapInstance {
  /** 激活焦点陷阱 */
  activate: () => void;
  /** 释放焦点陷阱并可选还原原焦点 */
  release: () => void;
  /** 暂停陷阱（被更高层弹窗覆盖时） */
  pause: () => void;
  /** 恢复陷阱（高层弹窗关闭后） */
  unpause: () => void;
  /** 当前是否处于激活状态 */
  readonly isActive: boolean;
  /** 当前被保护的容器元素 */
  readonly container: HTMLElement;
}

const FOCUSABLE_SELECTOR = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function isElementFocusable(el: HTMLElement): boolean {
  if (!el || typeof el.hasAttribute !== 'function') return false;
  if (el.hasAttribute('disabled')) return false;
  if (typeof el.getAttribute === 'function' && el.getAttribute('aria-hidden') === 'true') return false;
  // offsetParent 为 null 时代表元素不可见（display: none 等），过滤跳过
  if ('offsetParent' in el && el.offsetParent === null) return false;
  return true;
}

// 活跃的 FocusTrap 栈，用于处理嵌套弹窗
const trapStack: FocusTrapInstance[] = [];

/**
 * 获取容器内所有真正可见且可聚焦的 DOM 元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return [];
  }
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return elements.filter(isElementFocusable);
}

/**
 * 创建并返回一个焦点陷阱实例
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrapInstance {
  const {
    initialFocus = null,
    restoreFocus = true,
    capture,
    fallbackToContainer = false,
  } = options;

  let active = false;
  let paused = false;
  let previousActiveElement: HTMLElement | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active || paused) return;
    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements(container);
    if (focusables.length === 0) {
      if (fallbackToContainer && typeof container.focus === 'function') {
        container.focus();
        e.preventDefault();
      }
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const doc = container.ownerDocument || (typeof document !== 'undefined' ? document : null);
    const current = (doc ? doc.activeElement : null) as HTMLElement | null;

    // 焦点已在容器外（程序化跳转等）——按 Tab 自动拉回圈内
    if (!current || (typeof container.contains === 'function' && !container.contains(current))) {
      e.preventDefault();
      if (first && typeof first.focus === 'function') first.focus();
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab：如果在第一个元素，循环到最后一个
      if (current === first) {
        e.preventDefault();
        if (last && typeof last.focus === 'function') last.focus();
      }
    } else {
      // Tab：如果在最后一个元素，循环到第一个
      if (current === last) {
        e.preventDefault();
        if (first && typeof first.focus === 'function') first.focus();
      }
    }
  };

  const instance: FocusTrapInstance = {
    get isActive() {
      return active;
    },
    get container() {
      return container;
    },
    activate() {
      if (active) return;

      const doc = container.ownerDocument || (typeof document !== 'undefined' ? document : null);
      if (doc && doc.activeElement) {
        previousActiveElement = doc.activeElement as HTMLElement;
      }

      // 如果已有其他激活的 trap，先暂停它
      const topTrap = trapStack[trapStack.length - 1];
      if (topTrap && topTrap !== instance) {
        topTrap.pause();
      }
      trapStack.push(instance);

      active = true;
      paused = false;

      // 绑定键盘监听：挂在 container 上，天然跟随容器生命周期
      if (container && typeof container.addEventListener === 'function') {
        if (typeof capture === 'boolean') {
          container.addEventListener('keydown', onKeyDown as EventListener, capture);
        } else {
          container.addEventListener('keydown', onKeyDown as EventListener);
        }
      }

      // 自动侦听容器脱离 DOM：若外部销毁未显式 release，由 MutationObserver 自动释放并清理栈
      if (typeof MutationObserver !== 'undefined' && container.parentNode) {
        const observer = new MutationObserver(() => {
          if (!container.isConnected) {
            instance.release();
            observer.disconnect();
          }
        });
        const root = doc?.body || container.parentNode;
        try {
          observer.observe(root, { childList: true, subtree: true });
        } catch {
          // 降级兼容非标准 DOM 容器
        }
      }

      // 执行初始聚焦
      let target: HTMLElement | null = null;
      if (typeof initialFocus === 'string' && typeof container.querySelector === 'function') {
        target = container.querySelector<HTMLElement>(initialFocus);
      } else if (initialFocus && typeof (initialFocus as HTMLElement).focus === 'function') {
        target = initialFocus as HTMLElement;
      }

      if (target && typeof target.focus === 'function') {
        setTimeout(() => {
          if (active && !paused && target && typeof target.focus === 'function') {
            target.focus();
          }
        }, 16);
      }
    },
    release() {
      if (!active) return;
      active = false;
      paused = false;

      // 解绑键盘监听
      if (container && typeof container.removeEventListener === 'function') {
        if (typeof capture === 'boolean') {
          container.removeEventListener('keydown', onKeyDown as EventListener, capture);
        } else {
          container.removeEventListener('keydown', onKeyDown as EventListener);
        }
      }

      // 从栈中移除
      const index = trapStack.indexOf(instance);
      if (index !== -1) {
        trapStack.splice(index, 1);
      }

      // 恢复栈顶前一个 trap
      const previousTrap = trapStack[trapStack.length - 1];
      if (previousTrap) {
        previousTrap.unpause();
      }

      // 归还焦点
      if (restoreFocus && previousActiveElement && typeof previousActiveElement.focus === 'function') {
        try {
          previousActiveElement.focus();
        } catch {
          // 忽略元素被销毁等边缘情况
        }
      }
      previousActiveElement = null;
    },
    pause() {
      paused = true;
    },
    unpause() {
      paused = false;
    },
  };

  return instance;
}

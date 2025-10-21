import { Buffer } from 'buffer';

globalThis.process = globalThis.process || { env: {} }; // Minimal process polyfill
globalThis.global = globalThis.global || globalThis;
globalThis.Buffer = globalThis.Buffer || Buffer;

declare global {
  interface WindowEventMap {
    'dydx:log': CustomEvent;
    'dydx:track': CustomEvent;
    'dydx:identify': CustomEvent;
  }

  var Intercom: any;
}


(function () {
  // 稳健的 UUID v4 生成器：优先使用 crypto.randomUUID -> crypto.getRandomValues -> Math.random 回退
  function getRandomUUID(): string {
    try {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID();
      }
    } catch (e) {
      // ignore
    }

    // 使用 crypto.getRandomValues 提高随机性
    try {
      if (
        typeof crypto !== 'undefined' &&
        typeof (crypto as any).getRandomValues === 'function' &&
        typeof Uint8Array !== 'undefined'
      ) {
        const bytes = (crypto as any).getRandomValues(new Uint8Array(16));
        // RFC4122 v4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes as number[])
          .map((b: number) => ('0' + b.toString(16)).slice(-2))
          .join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
          16,
          20
        )}-${hex.slice(20)}`;
      }
    } catch (e) {
      // ignore
    }

    // 最后回退到 Math.random 实现
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function attachToGlobal(target: any) {
    if (!target) return;
    try {
      // 保证有 crypto 对象
      target.crypto ||= ({} as Crypto);
    } catch (e) {
      // 某些环境对全局对象只读，忽略
    }

    try {
      if (target.crypto && typeof target.crypto.randomUUID !== 'function') {
        Object.defineProperty(target.crypto, 'randomUUID', {
          value: getRandomUUID,
          writable: false,
          configurable: true,
        });
      }
    } catch (e) {
      // 忽略无法设置的情况
    }

    // 也在 globalThis/window 上暴露一个 helper，方便代码直接调用
    try {
      if (typeof target.getRandomUUID !== 'function') {
        Object.defineProperty(target, 'getRandomUUID', {
          value: getRandomUUID,
          writable: false,
          configurable: true,
        });
      }
    } catch (e) {
      // ignore
    }
  }

  attachToGlobal(typeof window !== 'undefined' ? window : undefined);
  attachToGlobal(typeof globalThis !== 'undefined' ? globalThis : undefined);
})();
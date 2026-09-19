import { renderHook, act, waitFor } from '@testing-library/react';
import { useWakeLock } from '@/hooks/useWakeLock';

/** Мок Wake Lock API: sentinel с release() и событием release */
function makeLockApi() {
  const sentinels: Array<{
    released: boolean;
    release: jest.Mock;
    listeners: Array<() => void>;
    addEventListener: (t: string, cb: () => void) => void;
  }> = [];
  const request = jest.fn(async () => {
    const s = {
      released: false,
      release: jest.fn(async () => { s.released = true; }),
      listeners: [] as Array<() => void>,
      addEventListener: (t: string, cb: () => void) => { if (t === 'release') s.listeners.push(cb); },
    };
    sentinels.push(s);
    return s;
  });
  (navigator as any).wakeLock = { request };
  return { request, sentinels };
}

const setSupported = (v: boolean) => {
  if (v) { (navigator as any).wakeLock = (navigator as any).wakeLock || { request: jest.fn() }; }
  else { delete (navigator as any).wakeLock; }
};

describe('useWakeLock', () => {
  beforeEach(() => {
    delete (navigator as any).wakeLock;
  });

  it('supported=false без API — inactive, запросов нет', async () => {
    setSupported(false);
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current.supported).toBe(false));
    expect(result.current.active).toBe(false);
  });

  it('enabled → берёт screen-lock; disable → релизит', async () => {
    const api = makeLockApi();
    const { result, rerender } = renderHook(({ enabled }) => useWakeLock(enabled), {
      initialProps: { enabled: true },
    });
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(api.request).toHaveBeenCalledWith('screen');

    rerender({ enabled: false });
    await waitFor(() => expect(result.current.active).toBe(false));
    expect(api.sentinels[0].release).toHaveBeenCalled();
  });

  it('возврат видимости после снятия системой — перезахват', async () => {
    const api = makeLockApi();
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current.active).toBe(true));

    // Система сняла лок (событие release на sentinel)
    act(() => { api.sentinels[0].listeners.forEach((cb) => cb()); });
    await waitFor(() => expect(result.current.active).toBe(false));

    // Страница снова видима — хук перезахватывает
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(api.request).toHaveBeenCalledTimes(2);
  });

  it('enable при скрытой странице — лок после возврата видимости', async () => {
    // request честно реджектит пока страница скрыта (браузерное поведение),
    // на видимой — обычный сентинел из общего мока
    const api = makeLockApi();
    const origImpl = api.request.getMockImplementation()!;
    api.request.mockImplementation(async (...args: Parameters<typeof origImpl>) => {
      if (document.visibilityState === 'hidden') throw new DOMException('hidden', 'NotAllowedError');
      return origImpl(...args);
    });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current.supported).toBe(true));
    // первый acquire упал (hidden) — не активен
    await waitFor(() => expect(result.current.active).toBe(false));
    // страница снова видима — берём
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(result.current.active).toBe(true));
  });

  it('request разрешился после unmount — сентинел сразу релизится (нет утечки лока)', async () => {
    let resolveRequest: (s: unknown) => void = () => {};
    const request = jest.fn(() => new Promise((res) => { resolveRequest = res; }));
    (navigator as any).wakeLock = { request };
    const { result, unmount } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current.supported).toBe(true));
    expect(request).toHaveBeenCalled(); // запрос в полёте

    unmount(); // cleanup выставил cancelled=true
    const sentinel = { released: false, release: jest.fn(async () => {}), addEventListener: jest.fn() };
    await act(async () => { resolveRequest(sentinel); });
    await act(async () => { await Promise.resolve(); });
    // Запоздавший сентинел никому не нужен — отпущен немедленно
    expect(sentinel.release).toHaveBeenCalled();
  });
});

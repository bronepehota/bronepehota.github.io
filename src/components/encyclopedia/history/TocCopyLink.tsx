'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { BASE_PATH } from '@/lib/constants';

interface TocCopyLinkProps {
  /** Chapter slug — the copied URL is the hub anchor `/encyclopedia/history#slug`. */
  slug: string;
  title: string;
}

/** navigator.clipboard with a legacy execCommand fallback (older iOS/insecure
 *  contexts) — returns false when neither works. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * «⧉» — copy the chapter anchor to the clipboard (the «сохранил ссылку» goal
 * of the history showcase). The ONLY interactive JS in the TOC: 44×44 tap
 * target, swaps to a check mark for 1.5s after a successful copy.
 */
export function TocCopyLink({ slug, title }: TocCopyLinkProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onCopy = useCallback(async () => {
    const url = `${window.location.origin}${BASE_PATH}/encyclopedia/history#${slug}`;
    const ok = await copyText(url);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [slug]);

  return (
    <button
      type="button"
      onClick={onCopy}
      data-testid="toc-copy-link"
      aria-label={copied ? 'Ссылка скопирована' : `Скопировать ссылку на «${title}»`}
      title={`Скопировать ссылку на «${title}»`}
      className="shrink-0 w-11 h-11 flex items-center justify-center text-military-taupe/80 hover:text-military-amber transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-hud-green" aria-hidden />
      ) : (
        <Copy className="w-4 h-4" aria-hidden />
      )}
    </button>
  );
}

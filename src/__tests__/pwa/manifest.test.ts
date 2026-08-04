import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * PWA manifest must be root-served: the site lives at a domain/account root
 * (bronepehota.github.io, or any future custom domain) — basePath is ''.
 * Guards against the static manifest drifting back to a /bronepehota subpath
 * (which 404s icons and breaks installability on a root deployment).
 */
const manifest = JSON.parse(
  readFileSync(join(process.cwd(), 'public/manifest.json'), 'utf-8'),
) as {
  start_url: string;
  scope: string;
  icons: Array<{ src: string; sizes: string }>;
};

describe('PWA manifest (root-served)', () => {
  it('start_url and scope point at the domain root', () => {
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
  });

  it('has no leftover /bronepehota subpath anywhere', () => {
    expect(manifest.start_url).not.toMatch(/bronepehota/);
    expect(manifest.scope).not.toMatch(/bronepehota/);
    manifest.icons.forEach((icon) => {
      expect(icon.src).not.toMatch(/bronepehota/);
    });
  });

  it('all icons resolve from the domain root', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    manifest.icons.forEach((icon) => {
      expect(icon.src.startsWith('/icons/')).toBe(true);
    });
  });
});

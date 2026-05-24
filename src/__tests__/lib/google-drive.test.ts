/**
 * Unit tests for google-drive.ts
 *
 * Google Identity Services and Drive API are browser-only globals.
 * We mock fetch and the google.accounts.oauth2 namespace.
 */

// Mock google global before importing
const mockTokenClient = {
  requestAccessToken: jest.fn(),
};
let oauthCallback: (response: { error?: string; access_token?: string }) => void = () => {};

beforeEach(() => {
  // Reset google global mock
  (globalThis as any).google = {
    accounts: {
      oauth2: {
        initTokenClient: jest.fn((opts: any) => {
          oauthCallback = opts.callback;
          return mockTokenClient;
        }),
      },
    },
  };
  jest.clearAllMocks();
});

afterEach(() => {
  delete (globalThis as any).google;
});

// We need to dynamically import since the module checks `typeof google`
// at call time, not import time.

describe('google-drive', () => {
  describe('isGisAvailable', () => {
    it('returns true when google.accounts.oauth2 is available', async () => {
      const { isGisAvailable } = await import('@/lib/google-drive');
      expect(isGisAvailable()).toBe(true);
    });

    it('returns false when google is undefined', async () => {
      delete (globalThis as any).google;
      const { isGisAvailable } = await import('@/lib/google-drive');
      expect(isGisAvailable()).toBe(false);
    });

    it('returns false when google.accounts is missing', async () => {
      (globalThis as any).google = {};
      const { isGisAvailable } = await import('@/lib/google-drive');
      expect(isGisAvailable()).toBe(false);
    });
  });

  describe('requestAccessToken', () => {
    it('rejects when GIS is not available', async () => {
      delete (globalThis as any).google;
      const { requestAccessToken } = await import('@/lib/google-drive');
      await expect(requestAccessToken('test-client-id')).rejects.toThrow('GIS not available');
    });

    it('resolves with access token on success', async () => {
      const { requestAccessToken } = await import('@/lib/google-drive');
      const promise = requestAccessToken('test-client-id');

      // Simulate successful OAuth response
      oauthCallback({ access_token: 'test-token-123' });

      const token = await promise;
      expect(token).toBe('test-token-123');
    });

    it('rejects on OAuth error', async () => {
      const { requestAccessToken } = await import('@/lib/google-drive');
      const promise = requestAccessToken('test-client-id');

      oauthCallback({ error: 'access_denied' });

      await expect(promise).rejects.toThrow('access_denied');
    });

    it('calls initTokenClient with correct client_id and scope', async () => {
      const { requestAccessToken } = await import('@/lib/google-drive');
      const promise = requestAccessToken('my-client-id');
      oauthCallback({ access_token: 't' });
      await promise;

      expect((globalThis as any).google.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'my-client-id',
          scope: 'https://www.googleapis.com/auth/drive.file',
        })
      );
    });
  });

  describe('Drive API functions', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    describe('listConfigFiles', () => {
      it('returns files from Drive API', async () => {
        const mockFiles = [
          { id: 'f1', name: 'bronepehota_config_1.json', modifiedTime: '2024-01-01' },
        ];
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ files: mockFiles }),
        });

        const { listConfigFiles } = await import('@/lib/google-drive');
        const files = await listConfigFiles('test-token');
        expect(files).toEqual(mockFiles);
      });

      it('throws on API error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 403,
        });

        const { listConfigFiles } = await import('@/lib/google-drive');
        await expect(listConfigFiles('test-token')).rejects.toThrow('Drive API error: 403');
      });

      it('returns empty array when no files', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const { listConfigFiles } = await import('@/lib/google-drive');
        const files = await listConfigFiles('test-token');
        expect(files).toEqual([]);
      });

      it('sends authorization header', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ files: [] }),
        });

        const { listConfigFiles } = await import('@/lib/google-drive');
        await listConfigFiles('my-token-xyz');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: 'Bearer my-token-xyz' },
          })
        );
      });
    });

    describe('downloadFile', () => {
      it('returns file content as text', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('{"version":1}'),
        });

        const { downloadFile } = await import('@/lib/google-drive');
        const content = await downloadFile('test-token', 'file-123');
        expect(content).toBe('{"version":1}');
      });

      it('throws on API error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
        });

        const { downloadFile } = await import('@/lib/google-drive');
        await expect(downloadFile('test-token', 'file-123')).rejects.toThrow('Drive API error: 404');
      });

      it('uses correct URL with alt=media', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(''),
        });

        const { downloadFile } = await import('@/lib/google-drive');
        await downloadFile('t', 'abc');

        const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
        expect(calledUrl).toContain('/files/abc?alt=media');
      });
    });

    describe('uploadConfigFile', () => {
      it('creates new file when no existing match', async () => {
        // listConfigFiles returns empty
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: [] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'new-file-id', name: 'test.json' }),
          });

        const { uploadConfigFile } = await import('@/lib/google-drive');
        const result = await uploadConfigFile('token', 'test.json', '{}');

        expect(result.id).toBe('new-file-id');
        // Second call should be POST (create)
        const secondCall = (global.fetch as jest.Mock).mock.calls[1];
        expect(secondCall[1].method).toBe('POST');
      });

      it('updates existing file when match found', async () => {
        const existingFile = { id: 'existing-id', name: 'test.json', modifiedTime: '2024-01-01' };
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: [existingFile] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'existing-id', name: 'test.json' }),
          });

        const { uploadConfigFile } = await import('@/lib/google-drive');
        const result = await uploadConfigFile('token', 'test.json', '{"data":1}');

        expect(result.id).toBe('existing-id');
        // Second call should be PATCH (update)
        const secondCall = (global.fetch as jest.Mock).mock.calls[1];
        expect(secondCall[1].method).toBe('PATCH');
      });

      it('throws on upload API error', async () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ files: [] }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
          });

        const { uploadConfigFile } = await import('@/lib/google-drive');
        await expect(uploadConfigFile('token', 'test.json', '{}')).rejects.toThrow('Drive API error: 500');
      });
    });
  });
});

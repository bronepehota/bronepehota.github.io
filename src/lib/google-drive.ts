const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisLoaded = false;

export function isGisAvailable(): boolean {
  return typeof window !== 'undefined' && typeof google !== 'undefined' && !!google.accounts?.oauth2;
}

export function loadGisScript(): Promise<void> {
  if (gisLoaded && isGisAvailable()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (isGisAvailable()) { clearInterval(check); gisLoaded = true; resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GIS load timeout')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (isGisAvailable()) { clearInterval(check); gisLoaded = true; resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GIS load timeout')); }, 10000);
    };
    script.onerror = () => reject(new Error('GIS script failed to load'));
    document.head.appendChild(script);
  });
}

export function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isGisAvailable()) {
      reject(new Error('GIS not available'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listConfigFiles(token: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("name contains 'bronepehota_config'");
  const url = `${DRIVE_API_BASE}/files?q=${query}&orderBy=modifiedTime desc&spaces=drive&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

export async function downloadFile(token: string, fileId: string): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  return await res.text();
}

export async function uploadConfigFile(
  token: string,
  fileName: string,
  content: string
): Promise<DriveFile> {
  const existing = await listConfigFiles(token);
  const match = existing.find((f) => f.name === fileName);

  const metadata = { name: fileName, mimeType: 'application/json' };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelim;

  if (match) {
    const url = `${DRIVE_UPLOAD_BASE}/files/${match.id}?uploadType=multipart`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    });
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    return await res.json();
  }

  const url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  return await res.json();
}
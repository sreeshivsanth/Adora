const DEFAULT_API_BASE = 'http://localhost:8787';

async function fetchWithFallback(urlPath: string, options?: RequestInit): Promise<Response> {
  const configuredBase = (import.meta.env.VITE_API_URL || '').trim();

  // Try configured endpoint first (Cloudflare tunnel or custom domain)
  if (configuredBase && configuredBase !== DEFAULT_API_BASE) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${configuredBase}${urlPath}`, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      console.warn(`[Adora API] Failed to reach ${configuredBase}, automatically falling back to ${DEFAULT_API_BASE}:`, err);
    }
  }

  // Fallback to local host
  return fetch(`${DEFAULT_API_BASE}${urlPath}`, options);
}

export async function login(username: string, password?: string, otp?: string) {
  const res = await fetchWithFallback('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, otp })
  });
  return res.json();
}

export async function searchTracks(query: string, language: string = 'all', token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithFallback(`/api/search?q=${encodeURIComponent(query)}&language=${language}`, {
    headers
  });
  return res.json();
}

export async function requestIngest(track: { title: string; artist: string; language: string }, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithFallback('/api/ingest', {
    method: 'POST',
    headers,
    body: JSON.stringify({ trackTitle: track.title, artist: track.artist, language: track.language })
  });
  return res.json();
}

export async function fetchAdminMetrics(token: string) {
  const res = await fetchWithFallback('/api/admin/metrics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function toggleAdmin2FA(enabled: boolean, token: string) {
  const res = await fetchWithFallback('/api/admin/settings/2fa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ enabled })
  });
  return res.json();
}

export async function requestPasswordReset(emailOrUsername: string) {
  const res = await fetchWithFallback('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername })
  });
  return res.json();
}

export async function fetchLocalTracks(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithFallback('/api/tracks/local', { headers });
  return res.json();
}

export function resolveAudioUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('asset:')) {
    return url;
  }
  const configuredBase = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).trim();
  return `${configuredBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

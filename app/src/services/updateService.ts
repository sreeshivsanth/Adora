// Adora In-App Auto-Update Checker Service
// Queries GitHub Releases API to notify users of new versions and allow 1-tap APK/Desktop updates

export const CURRENT_APP_VERSION = '1.0.0';
const GITHUB_REPO = 'sreeshivsanth/Adora';
const DISMISSED_UPDATE_KEY = 'adora_dismissed_update_version';

export interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTag: string;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  apkAsset: ReleaseAsset | null;
  windowsAsset: ReleaseAsset | null;
  linuxAsset: ReleaseAsset | null;
  releaseHtmlUrl: string;
}

/**
 * Compares two semantic version strings (e.g. "1.0.9" vs "1.0.0")
 * Returns 1 if v1 > v2, -1 if v1 < v2, and 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases API for the latest published version
 * @param silent If true, suppresses notification if this version was already dismissed by user
 */
export async function checkForUpdates(silent: boolean = false): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub Releases HTTP error ${response.status}`);
    }

    const data = await response.json();
    const releaseTag = (data.tag_name || '').trim();
    const latestVersion = releaseTag.replace(/^v/, '');

    const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

    // In silent startup mode, don't show if user previously dismissed this exact version
    if (silent && isNewer) {
      const dismissed = localStorage.getItem(DISMISSED_UPDATE_KEY);
      if (dismissed === latestVersion) {
        return null;
      }
    }

    const assets: ReleaseAsset[] = Array.isArray(data.assets) ? data.assets : [];

    const apkAsset = assets.find(a => a.name.toLowerCase().endsWith('.apk')) || null;
    const windowsAsset = assets.find(a => a.name.toLowerCase().endsWith('-setup.exe') || a.name.toLowerCase().endsWith('.exe')) || null;
    const linuxAsset = assets.find(a => a.name.toLowerCase().endsWith('.appimage') || a.name.toLowerCase().endsWith('.deb')) || null;

    return {
      hasUpdate: isNewer,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseTag,
      releaseTitle: data.name || `Adora ${releaseTag}`,
      releaseNotes: data.body || 'New features, performance enhancements, and bug fixes.',
      publishedAt: data.published_at || new Date().toISOString(),
      apkAsset,
      windowsAsset,
      linuxAsset,
      releaseHtmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`
    };
  } catch (err) {
    console.warn('[Adora Update Checker]', err);
    return null;
  }
}

/**
 * Dismisses update prompt for a specific version
 */
export function dismissUpdateVersion(version: string) {
  try {
    localStorage.setItem(DISMISSED_UPDATE_KEY, version);
  } catch {
    // Ignore storage quota
  }
}

/**
 * Formats byte size into human readable string (e.g. 24.5 MB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


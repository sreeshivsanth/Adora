export interface RegionOption {
  code: string;
  name: string;
  flag: string;
  description: string;
  itunesCountry: string;
  defaultLanguages: string[];
}

export const REGIONS: RegionOption[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    description: 'Bollywood, Kollywood, Tollywood & Indian indie',
    itunesCountry: 'in',
    defaultLanguages: ['tamil', 'hindi', 'english']
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    description: 'Billboard Hot 100, Pop, Hip-Hop & R&B',
    itunesCountry: 'us',
    defaultLanguages: ['english']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    description: 'Official UK Top 40, Drill, Indie & Dance',
    itunesCountry: 'gb',
    defaultLanguages: ['english']
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    description: 'Canadian Top 40, Global Hits & Indie',
    itunesCountry: 'ca',
    defaultLanguages: ['english']
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    description: 'ARIA Top Charts & Oceanic Indie',
    itunesCountry: 'au',
    defaultLanguages: ['english']
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    description: 'Middle East Top Hits, Arabic & International',
    itunesCountry: 'ae',
    defaultLanguages: ['english', 'hindi']
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    description: 'Southeast Asian Pop, Tamil & Global Hits',
    itunesCountry: 'sg',
    defaultLanguages: ['english', 'tamil']
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    description: 'Offizielle Deutsche Charts, Electronic & Rock',
    itunesCountry: 'de',
    defaultLanguages: ['english']
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    description: 'Oricon Top Songs, J-Pop & Anime Soundtracks',
    itunesCountry: 'jp',
    defaultLanguages: ['japanese', 'english']
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    description: 'Circle & Melon Top Charts, K-Pop & R&B',
    itunesCountry: 'kr',
    defaultLanguages: ['korean', 'english']
  },
  {
    code: 'GLOBAL',
    name: 'Worldwide / Global',
    flag: '🌐',
    description: 'Global Top 50, Viral Hits & International Charts',
    itunesCountry: 'us',
    defaultLanguages: ['english', 'spanish']
  }
];

export function getRegionByCode(code?: string): RegionOption {
  if (!code) return REGIONS[0];
  const upper = code.toUpperCase();
  return REGIONS.find(r => r.code === upper) || REGIONS[0];
}

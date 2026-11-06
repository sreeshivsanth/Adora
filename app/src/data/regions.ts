export interface StateOption {
  code: string;
  name: string;
  defaultLanguages: string[];
}

export interface RegionOption {
  code: string;
  name: string;
  flag: string;
  description: string;
  itunesCountry: string;
  defaultLanguages: string[];
  states?: StateOption[];
}

export const REGIONS: RegionOption[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    description: 'Bollywood, Kollywood, Tollywood & Indian indie',
    itunesCountry: 'in',
    defaultLanguages: ['tamil', 'hindi', 'english'],
    states: [
      { code: 'TN', name: 'Tamil Nadu', defaultLanguages: ['tamil', 'english'] },
      { code: 'MH', name: 'Maharashtra (Mumbai / Pune)', defaultLanguages: ['hindi', 'english'] },
      { code: 'KA', name: 'Karnataka (Bengaluru)', defaultLanguages: ['kannada', 'tamil', 'hindi', 'english'] },
      { code: 'KL', name: 'Kerala', defaultLanguages: ['malayalam', 'tamil', 'english'] },
      { code: 'TS_AP', name: 'Telangana & Andhra Pradesh', defaultLanguages: ['telugu', 'hindi', 'english'] },
      { code: 'PB', name: 'Punjab & Chandigarh', defaultLanguages: ['punjabi', 'hindi', 'english'] },
      { code: 'DL', name: 'Delhi NCR & North India', defaultLanguages: ['hindi', 'punjabi', 'english'] },
      { code: 'WB', name: 'West Bengal (Kolkata)', defaultLanguages: ['hindi', 'english'] },
      { code: 'GJ', name: 'Gujarat', defaultLanguages: ['hindi', 'english'] },
      { code: 'RJ', name: 'Rajasthan', defaultLanguages: ['hindi', 'english'] },
      { code: 'ALL', name: 'All States / Pan-India', defaultLanguages: ['tamil', 'hindi', 'english'] }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    description: 'Billboard Hot 100, Pop, Hip-Hop & R&B',
    itunesCountry: 'us',
    defaultLanguages: ['english'],
    states: [
      { code: 'CA', name: 'California (West Coast)', defaultLanguages: ['english', 'spanish'] },
      { code: 'NY', name: 'New York / Tri-State', defaultLanguages: ['english'] },
      { code: 'TX', name: 'Texas (Austin / Houston / Dallas)', defaultLanguages: ['english', 'spanish'] },
      { code: 'FL', name: 'Florida (Miami / Orlando)', defaultLanguages: ['english', 'spanish'] },
      { code: 'IL', name: 'Illinois (Chicago)', defaultLanguages: ['english'] },
      { code: 'GA', name: 'Georgia (Atlanta Hip-Hop)', defaultLanguages: ['english'] },
      { code: 'TN_US', name: 'Tennessee (Nashville Country)', defaultLanguages: ['english'] },
      { code: 'ALL', name: 'All US States (National)', defaultLanguages: ['english'] }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    description: 'Official UK Top 40, Drill, Indie & Dance',
    itunesCountry: 'gb',
    defaultLanguages: ['english'],
    states: [
      { code: 'LDN', name: 'Greater London & South', defaultLanguages: ['english'] },
      { code: 'NW', name: 'North West (Manchester / Liverpool)', defaultLanguages: ['english'] },
      { code: 'MID', name: 'Midlands (Birmingham)', defaultLanguages: ['english'] },
      { code: 'SCT', name: 'Scotland (Glasgow / Edinburgh)', defaultLanguages: ['english'] },
      { code: 'WLS', name: 'Wales', defaultLanguages: ['english'] },
      { code: 'NI', name: 'Northern Ireland', defaultLanguages: ['english'] }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    description: 'Canadian Top 40, Global Hits & Indie',
    itunesCountry: 'ca',
    defaultLanguages: ['english'],
    states: [
      { code: 'ON', name: 'Ontario (Toronto / Ottawa)', defaultLanguages: ['english', 'punjabi'] },
      { code: 'BC', name: 'British Columbia (Vancouver)', defaultLanguages: ['english', 'punjabi'] },
      { code: 'QC', name: 'Quebec (Montreal)', defaultLanguages: ['english'] },
      { code: 'AB', name: 'Alberta (Calgary / Edmonton)', defaultLanguages: ['english'] }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    description: 'ARIA Top Charts & Oceanic Indie',
    itunesCountry: 'au',
    defaultLanguages: ['english'],
    states: [
      { code: 'NSW', name: 'New South Wales (Sydney)', defaultLanguages: ['english'] },
      { code: 'VIC', name: 'Victoria (Melbourne)', defaultLanguages: ['english'] },
      { code: 'QLD', name: 'Queensland (Brisbane)', defaultLanguages: ['english'] },
      { code: 'WA', name: 'Western Australia (Perth)', defaultLanguages: ['english'] }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    description: 'Middle East Top Hits, Arabic & International',
    itunesCountry: 'ae',
    defaultLanguages: ['english', 'hindi'],
    states: [
      { code: 'DXB', name: 'Dubai', defaultLanguages: ['english', 'hindi'] },
      { code: 'AUH', name: 'Abu Dhabi', defaultLanguages: ['english', 'hindi'] },
      { code: 'SHJ', name: 'Sharjah', defaultLanguages: ['english', 'hindi'] }
    ]
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
    defaultLanguages: ['english'],
    states: [
      { code: 'BER', name: 'Berlin', defaultLanguages: ['english'] },
      { code: 'BY', name: 'Bavaria (Munich)', defaultLanguages: ['english'] },
      { code: 'NW_DE', name: 'North Rhine-Westphalia', defaultLanguages: ['english'] }
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    description: 'Oricon Top Songs, J-Pop & Anime Soundtracks',
    itunesCountry: 'jp',
    defaultLanguages: ['japanese', 'english'],
    states: [
      { code: 'TKO', name: 'Tokyo Metropolis', defaultLanguages: ['japanese', 'english'] },
      { code: 'KNS', name: 'Kansai (Osaka / Kyoto)', defaultLanguages: ['japanese', 'english'] }
    ]
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    description: 'Circle & Melon Top Charts, K-Pop & R&B',
    itunesCountry: 'kr',
    defaultLanguages: ['korean', 'english'],
    states: [
      { code: 'SEL', name: 'Seoul Capital Area', defaultLanguages: ['korean', 'english'] },
      { code: 'BSN', name: 'Busan & Southeastern', defaultLanguages: ['korean', 'english'] }
    ]
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

export function getStatesForRegion(regionCode?: string): StateOption[] {
  const reg = getRegionByCode(regionCode);
  return reg.states || [];
}

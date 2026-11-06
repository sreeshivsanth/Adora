export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export const SYNCED_LYRICS_DB: Record<string, LyricLine[]> = {
  // Vaathi Coming (Master)
  'vaathi': [
    { time: 0, text: "♪ [Upbeat Brass & Thara Local Percussion] ♪" },
    { time: 8, text: "Kaathirundha thara local aattam vandhuduchu" },
    { time: 14, text: "Thalavaram panna vaathiyar vandhutaaru..." },
    { time: 22, text: "Kannaana kanne vaathi coming othukko!" },
    { time: 30, text: "Gubeerunu satham yerum othukko othukko!" },
    { time: 38, text: "Vaathi coming othukko... Gubeerunu keka othukko!" },
    { time: 46, text: "Vaathi ride-u ready aachu, thara local beat-u pochu!" },
    { time: 58, text: "♪ [Epic Instrumental Drop & Beat Blast] ♪" },
    { time: 72, text: "Oorukulle namma satham, thara local vediya kottum!" },
    { time: 85, text: "Kannaana kanne vaathi coming othukko!" },
    { time: 98, text: "Adra sakkara adra sakkara vaathi entry!" },
    { time: 115, text: "Kanna pinna kuthu aattam, aada vandha namma koottam!" },
    { time: 130, text: "Vaathi coming othukko! Gubeerunu othukko!" },
    { time: 150, text: "♪ [Energetic Rhythm Section] ♪" },
    { time: 175, text: "Vaathi coming... Vaathi coming othukko!" },
    { time: 200, text: "Thalaivar alappara thara local aatam mudinjadhu!" }
  ],

  // Enjoy Enjaami
  'enjoy': [
    { time: 0, text: "♪ [Organic Folk Acoustic Introit] ♪" },
    { time: 8, text: "Kookkoo kookkoo thaatha thaatha kala vettum" },
    { time: 15, text: "Kookkoo kookkoo pondhula yaaru meen kothum" },
    { time: 23, text: "Kookkoo kookkoo thanniyil odum thavalaiyoda" },
    { time: 32, text: "Kookkoo kookkoo kombula aada mayiladum..." },
    { time: 42, text: "Enjoy enjaami vaango vaango onnaagi" },
    { time: 50, text: "Ammaane aagaasa thottil katti aadaagi" },
    { time: 60, text: "Pattamboochi koothaadum kaattukulle vandhaachu" },
    { time: 72, text: "Nallapadi paadiputtu paatha kaatta paathukko!" },
    { time: 86, text: "Enjoy enjaami... Vaango vaango onnaagi!" },
    { time: 102, text: "♪ [Arivu Rap Verse & Deep Bass Groove] ♪" },
    { time: 120, text: "Paattan pootan kaatha kaadu, vithula sedi pottu valatha veedu" },
    { time: 138, text: "Nee vera naan vera illa, indha boomi namma thaaye pulla!" },
    { time: 155, text: "Kookkoo kookkoo... Enjoy enjaami!" },
    { time: 180, text: "♪ [Euphoric Vocal Harmonies & Claps] ♪" },
    { time: 210, text: "Vanna mayile ninnaduma... Enjoy enjaami vaango onnaagi!" }
  ],

  // Kesariya (Brahmāstra)
  'kesariya': [
    { time: 0, text: "♪ [Acoustic Guitar & Warm Ambient Drone] ♪" },
    { time: 12, text: "Mujhko itna bataaye koyi..." },
    { time: 18, text: "Kaise tujhse dil na lagaaye koyi" },
    { time: 26, text: "Rabba ne tujhko banaane mein" },
    { time: 34, text: "Kardi hai husn ki khaali tijoriyaan..." },
    { time: 44, text: "Kajal ki siyahi se likhi hai tune jaane" },
    { time: 54, text: "Kitno ki love storiyaan..." },
    { time: 64, text: "Kesariya tera ishq hai piya..." },
    { time: 74, text: "Rang jaaun jo main haath lagaaun" },
    { time: 84, text: "Din beete saara teri fikr mein" },
    { time: 94, text: "Rain saari teri khair manaayein..." },
    { time: 106, text: "Kesariya tera ishq hai piya!" },
    { time: 120, text: "♪ [Symphonic Violin Strings Swell] ♪" },
    { time: 135, text: "Patjhad ke mausam mein bhi phool khil jaate hain" },
    { time: 150, text: "Jab tu muskuraata hai, sab gham bhool jaate hain..." },
    { time: 168, text: "Kesariya tera ishq hai piya, rang jaaun jo main haath lagaaun!" }
  ],

  // Hukum (Jailer)
  'hukum': [
    { time: 0, text: "♪ [Dark Bassline & Heavy Drum Rhythm] ♪" },
    { time: 10, text: "Alappara kelapparom... Thalaivar neram aachu!" },
    { time: 18, text: "Kodangi adikkudhu... Kootam serudhu!" },
    { time: 28, text: "Hukum... Tiger ka hukum!" },
    { time: 38, text: "Idhu thalaivar kalam... Thala vanangaadhe!" },
    { time: 48, text: "Singathoda koottathula koodi nikkum aatukutti..." },
    { time: 60, text: "Vettaikaran vandhutaanu kaattukulle therinjiduchu!" },
    { time: 72, text: "Hukum... Tiger ka hukum!" },
    { time: 88, text: "♪ [Anirudh Electronic Bass Drop] ♪" },
    { time: 110, text: "Kanna patha kathikira, kaiyya vecha sethukura..." },
    { time: 130, text: "Nee paatha thalaivar vera, innoru aatam aada pora!" }
  ],

  // Starboy (The Weeknd)
  'starboy': [
    { time: 0, text: "♪ [Daft Punk Analog Synth Pulse] ♪" },
    { time: 11, text: "I'm tryna put you in the worst mood, ah" },
    { time: 16, text: "P1 cleaner than your church shoes, ah" },
    { time: 22, text: "Milli point two just to hurt you, ah" },
    { time: 28, text: "All red Lamb' just to tease you, ah..." },
    { time: 35, text: "None of these toys on lease too, ah" },
    { time: 42, text: "Made your whole year in a week too, yah" },
    { time: 48, text: "Look what you've done..." },
    { time: 54, text: "I'm a motherfuckin' starboy!" },
    { time: 64, text: "Look what you've done... I'm a starboy!" },
    { time: 76, text: "♪ [Daft Punk Chorus Hook & Vocoder] ♪" },
    { time: 92, text: "House so empty, need a centerpiece" },
    { time: 105, text: "Twenty racks around couple tables, lavish feast..." },
    { time: 120, text: "Look what you've done, I'm a starboy!" }
  ]
};

export function getSyncedLyricsForTrack(title: string, artist: string, durationSec: number = 200): LyricLine[] {
  const query = `${title.toLowerCase()} ${artist.toLowerCase()}`;
  
  if (query.includes('vaathi')) return SYNCED_LYRICS_DB['vaathi'];
  if (query.includes('enjaami')) return SYNCED_LYRICS_DB['enjoy'];
  if (query.includes('kesariya')) return SYNCED_LYRICS_DB['kesariya'];
  if (query.includes('hukum')) return SYNCED_LYRICS_DB['hukum'];
  if (query.includes('starboy')) return SYNCED_LYRICS_DB['starboy'];

  // Procedural dynamic lyrical movement synced precisely to duration:
  const step = Math.max(8, Math.floor(durationSec / 12));
  return [
    { time: 0, text: `♪ [Acoustic Intro • Listening to "${title}"] ♪` },
    { time: Math.floor(step * 0.8), text: `Drifting softly into the rhythm of ${artist}...` },
    { time: Math.floor(step * 1.8), text: `Soundwaves dancing in warm ambient warmth,` },
    { time: Math.floor(step * 2.8), text: `Every note resonant, soothing and deeply alive.` },
    { time: Math.floor(step * 4.0), text: `♪ [Harmonic Chorus & Melodic Elevation] ♪` },
    { time: Math.floor(step * 5.2), text: `Lost in the serene cadence of ${title},` },
    { time: Math.floor(step * 6.4), text: `Echoes reflecting through tranquil analog chambers.` },
    { time: Math.floor(step * 7.6), text: `No rush, just the pure acoustic vibration.` },
    { time: Math.floor(step * 9.0), text: `♪ [Dynamic Instrumental Flow] ♪` },
    { time: Math.floor(step * 10.2), text: `Floating effortlessly as the melody fades into calm...` },
    { time: Math.floor(step * 11.2), text: `♪ [Gentle Acoustic Outro] ♪` }
  ];
}

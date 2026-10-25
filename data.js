// Portfolio content. To add an item, copy an existing entry in the right list and edit it.
export const profile = {
  name: 'Qudratov Olimjon',
  avatar: 'assets/avatar.jpg', // square image; initials fallback shows if the file is missing
  // type picks the icon: email | telegram | linkedin | github
  contacts: [
    { type: 'email', label: 'Email', value: 'qudratov7olimjon7@gmail.com', href: 'mailto:qudratov7olimjon7@gmail.com' },
    { type: 'telegram', label: 'Telegram', value: '@A24446666688888888', href: 'https://t.me/A24446666688888888' },
    { type: 'linkedin', label: 'LinkedIn', value: 'olimjon-qudratov-169528436', href: 'https://www.linkedin.com/in/olimjon-qudratov-169528436' },
    { type: 'github', label: 'GitHub', value: 'qudratov7olimjon7-beep', href: 'https://github.com/qudratov7olimjon7-beep' },
  ],
};

/* Achievement: shown on the globe, grouped by country.
   { id, name, date: 'YYYY-MM-DD' or 'YYYY', country, result, short, role, robot, details? }
   `country` must match world-atlas `properties.name` (e.g. 'Uzbekistan', 'United States of America'). */
const WRO = { role: 'Designer, Builder',
  robot: 'An autonomous Mars rover with a built-in computer, designed to reduce the time it takes for a message to arrive.' };
const FGC = { role: 'Designer, Builder, Human Player',
  robot: 'Built to the season requirements to deal with fire by throwing special balls into it.' };

export const achievements = [
  { id: 'wro-2025-uz', name: 'WRO 2025 · National round', date: '2025', country: 'Uzbekistan', result: '1st place in Uzbekistan',
    short: 'World Robot Olympiad', ...WRO, details: 'Qualified for the WRO 2025 International Final in Singapore.' },
  { id: 'wro-2025-sg', name: 'WRO 2025 · International Final', date: '2025-11-27', country: 'Singapore', result: '22nd place',
    short: 'World Robot Olympiad', ...WRO, details: 'Reached the final after 1st place in the Uzbekistan national round.' },
  { id: 'fgc-2026-kz', name: 'FGC 2026 · Kazakhstan', date: '2026-08-24', country: 'Kazakhstan', result: '2nd place',
    short: 'FIRST Global Challenge', ...FGC, details: 'Also placed 4th in the Uzbekistan national round.' },
  { id: 'fgc-2026-uz', name: 'FGC 2026 · National round', date: '2026', country: 'Uzbekistan', result: '4th place in Uzbekistan',
    short: 'FIRST Global Challenge', ...FGC, details: 'Also took 2nd place at a competition in Kazakhstan.' },
];

// Upcoming: shown as a small line in the Achievements view, not on the globe. { name, note }
export const upcoming = [{ name: 'FTC', note: 'Coming soon' }];

/* Card item (certificates, projects, websites):
   { id, title, date: 'YYYY-MM-DD' or 'YYYY', subtitle, thumb, image, details, facts?: [[label, value], ...], link? }
   thumb = small preview image, image = full image shown when opened (both optional).
   soon: true = shown as a dimmed 'Coming soon' tile that can't be opened. */
export const certificates = [
  { id: 'ielts-2026', title: 'IELTS Academic', date: '2026-07-19', subtitle: 'British Council · Overall band 7.0 · CEFR C1',
    thumb: 'assets/certs/ielts-2026-thumb.jpg', image: 'assets/certs/ielts-2026.jpg',
    details: 'IELTS Academic Test Report Form issued by the British Council. Personal identifiers redacted.',
    table: { head: ['Section', 'Band'], rows: [['Listening', '7.5'], ['Reading', '7.5'], ['Writing', '6.0'], ['Speaking', '6.5'], ['Overall', '7.0'], ['CEFR level', 'C1']] } },
  { id: 'ap-calc-bc', title: 'AP Calculus BC', subtitle: 'Coming soon', soon: true },
];

export const projects = [
  { id: 'ai-conveyor', title: 'AI-powered conveyor belt', subtitle: 'Coming soon', soon: true },
];
export const websites = [
  { id: 'uzbek-songwriter', title: 'Uzbek Songwriter', date: '2026', subtitle: 'Funny Uzbek songs from an idea in any language',
    thumb: 'assets/websites/songwriter-thumb.jpg', image: 'assets/websites/songwriter-desktop.jpg', link: 'https://qudratov7olimjon7-beep.github.io/uzbek-songwriter/',
    gallery: [['assets/websites/songwriter-mobile.jpg', 'Uzbek Songwriter on a phone showing a generated song']],
    details: 'Type an idea in any language and instantly get a funny Uzbek song! Every song is saved in the archive, and you can listen to it in a male or female voice. Note: open it in Microsoft Edge to hear the audio.' },
  { id: 'tarjimon', title: 'Tarjimon', date: '2026', subtitle: 'Translator into the new 29-letter Uzbek alphabet',
    thumb: 'assets/websites/tarjimon-thumb.jpg', image: 'assets/websites/tarjimon-desktop.jpg', link: 'https://qudratov7olimjon7-beep.github.io/tarjimon/',
    gallery: [['assets/websites/tarjimon-mobile-en.jpg', 'Tarjimon on a phone translating English'], ['assets/websites/tarjimon-mobile-ar.jpg', 'Tarjimon on a phone translating Arabic']],
    details: 'Tarjimon is a free website where you type text in any language. It figures out the language by itself, translates the meaning into Uzbek, and writes the result in the new 29-letter Uzbek alphabet (ö, ğ, ş, ç), with a button to copy it.' },
  { id: 'portfolio', title: 'Personal Portfolio', date: '2026', subtitle: 'This site: interactive 3D globe of my achievements',
    thumb: 'assets/websites/portfolio-thumb.jpg', image: 'assets/websites/portfolio-thumb.jpg', link: 'https://qudratov7olimjon7-beep.github.io/',
    details: 'A 3D Earth showing my achievements by country, a star field that reacts to the cursor, Apple-style card animations, and tabs for achievements, projects, websites and certificates. Built with HTML, CSS, JavaScript and globe.gl / three.js.' },
];

// Portfolio content. To add an item, copy an existing entry in the right list and edit it.
export const profile = {
  name: 'Qudratov Olimjon',
  avatar: 'assets/avatar.jpg', // square image; initials fallback shows if the file is missing
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
  { id: 'fgc-2026-kz', name: 'FGC 2026 · Finals', date: '2026-08-24', country: 'Kazakhstan', result: '2nd place in the finals',
    short: 'FIRST Global Challenge', ...FGC, details: 'Also placed 4th in the Uzbekistan national round.' },
  { id: 'fgc-2026-uz', name: 'FGC 2026 · National round', date: '2026', country: 'Uzbekistan', result: '4th place in Uzbekistan',
    short: 'FIRST Global Challenge', ...FGC, details: 'Went on to take 2nd place in the finals in Kazakhstan.' },
];

// Upcoming: shown as a small line in the Achievements view, not on the globe. { name, note }
export const upcoming = [{ name: 'FTC', note: 'Coming soon' }];

/* Card item (certificates, projects, websites):
   { id, title, date: 'YYYY-MM-DD' or 'YYYY', subtitle, thumb, image, details, facts?: [[label, value], ...], link? }
   thumb = small preview image, image = full image shown when opened (both optional). */
export const certificates = [
  { id: 'ielts-2026', title: 'IELTS Academic', date: '2026-07-19', subtitle: 'Overall band 7.0 · CEFR C1',
    thumb: 'assets/certs/ielts-2026-thumb.jpg', image: 'assets/certs/ielts-2026.jpg',
    details: 'Test Report Form, British Council / IDP / Cambridge English. Personal identifiers redacted.',
    facts: [['Overall', '7.0'], ['CEFR', 'C1'], ['Listening', '7.5'], ['Reading', '7.5'], ['Writing', '6.0'], ['Speaking', '6.5']] },
];

export const projects = [];
export const websites = [
  { id: 'portfolio', title: 'Personal Portfolio', date: '2026', subtitle: 'This site: interactive 3D globe of my achievements',
    thumb: 'assets/websites/portfolio-thumb.jpg', image: 'assets/websites/portfolio-thumb.jpg', link: 'https://qudratov7olimjon7-beep.github.io/',
    details: 'A 3D Earth showing my achievements by country, a star field that reacts to the cursor, Apple-style card animations, and tabs for achievements, projects, websites and certificates. Built with HTML, CSS, JavaScript and globe.gl / three.js.' },
];

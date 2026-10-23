// Portfolio content. To add an item, copy an existing entry in the right list and edit it.
export const profile = {
  name: 'Qudratov Olimjon',
  avatar: 'assets/avatar.jpg', // square image; initials fallback shows if the file is missing
};

/* Achievement: shown on the globe, grouped by country.
   { id, name, year, country, result, short, details }
   `country` must match world-atlas `properties.name` (e.g. 'Japan', 'United States of America'). */
// EXAMPLE DATA — not real results.
export const achievements = [
  { id: 'wro-2025', name: 'World Robot Olympiad 2025', year: 2025, country: 'Singapore', result: 'Example: Finalist',
    short: 'International robotics finals.', details: 'EXAMPLE. Designed and programmed an autonomous robot for the international final. Replace with real description.' },
  { id: 'sg-hack-2024', name: 'Singapore Youth Hackathon', year: 2024, country: 'Singapore', result: 'Example: 2nd place',
    short: '48‑hour build sprint.', details: 'EXAMPLE. Built a prototype in 48 hours with a team of three. Replace with real description.' },
];

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

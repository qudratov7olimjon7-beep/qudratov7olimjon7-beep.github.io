// Tiny local Q&A engine. Answers ONLY from data.js — no network, no invented facts.
import { profile, achievements, upcoming, certificates, projects, websites } from './data.js';

const first = profile.name.split(/\s+/).pop();
const list = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
const when = (d) => /^\d{4}$/.test(d) ? d : new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const line = (a) => `${a.name} (${a.country}, ${when(a.date)}): ${a.result}`;
const byComp = (tag) => achievements.filter((a) => a.id.startsWith(tag));
const contactText = (cs) => cs.map((c) => `${c.label}: ${c.value}${c.type === 'email' ? '' : ` (${c.href})`}`).join('\n');

function about() {
  const comps = [...new Set(achievements.map((a) => a.short))];
  return `${profile.name} designs and builds competition robots. He has competed in ${list(comps)}` +
    (certificates.some((c) => !c.soon) ? `, and holds ${list(certificates.filter((c) => !c.soon).map((c) => c.title))}` : '') + '.';
}
function competition(tag, label) {
  const xs = byComp(tag); if (!xs.length) return null;
  const { role, robot } = xs[0];
  return `${first} took part in ${label}:\n${xs.map((a) => '• ' + line(a)).join('\n')}\nHis role: ${role}.\nThe robot: ${robot}`;
}

// Intents are checked in order; the first whose test matches wins.
const intents = [
  { test: /\b(hi|hello|hey|salom|privet)\b/, reply: () => `Hi! Ask me anything about ${first}: his competitions, robots, certificates or how to contact him.` },
  { test: /\b(contact|email|e-mail|mail|telegram|linkedin|github|reach|message|write to)\b/, reply: (q) => {
      const one = profile.contacts.filter((c) => q.includes(c.type) || q.includes(c.label.toLowerCase()));
      const cs = one.length && one.length < profile.contacts.length ? one : profile.contacts;
      return `You can reach ${first} here:\n${contactText(cs)}`; } },
  { test: /\b(ielts|english|band|certificate|certificates|certified)\b/, reply: () => certificates.length
      ? certificates.map((c) => c.soon ? `${c.title} is coming soon.` : `${first} took ${c.title} on ${when(c.date)} — ${c.subtitle}.` +
        (c.table ? ` Section scores: ${c.table.rows.filter(([k]) => !['Overall', 'CEFR level'].includes(k)).map(([k, v]) => `${k} ${v}`).join(', ')}.` : '')).join('\n')
      : `No certificates are listed on this site yet.` },
  { test: /\b(wro|world robot|olympiad|rover|mars)\b/, reply: () => competition('wro', 'the World Robot Olympiad (WRO) 2025') },
  { test: /\b(fgc|first global|fire)\b/, reply: () => competition('fgc', 'the FIRST Global Challenge (FGC) 2026') },
  { test: /\b(ftc|upcoming|next|future|plan|plans)\b/, reply: () => upcoming.length
      ? `Coming up: ${list(upcoming.map((u) => u.name))}. More details will be added here later.` : `Nothing upcoming is listed yet.` },
  { test: /\b(robot|robots|build|built)\b/, reply: () => {
      const seen = new Map(achievements.map((a) => [a.short, a.robot]));
      return `${first} has built robots for:\n${[...seen].map(([c, r]) => `• ${c}: ${r}`).join('\n')}`; } },
  { test: /\b(role|roles|job|do in the team|position)\b/, reply: () => {
      const seen = new Map(achievements.map((a) => [a.short, a.role]));
      return [...seen].map(([c, r]) => `In ${c} he was: ${r}.`).join('\n'); } },
  { test: /\b(website|websites|site|portfolio)\b/, reply: () => websites.length
      ? websites.map((w) => `${w.title}: ${w.subtitle}.${w.link ? ` ${w.link}` : ''}`).join('\n') : `No websites are listed yet.` },
  { test: /\b(project|projects)\b/, reply: () => projects.length
      ? projects.map((p) => `${p.title}: ${p.subtitle || ''}`).join('\n') : `No projects are listed on this site yet. Check back soon!` },
  { test: /\b(competition|competitions|compete|competed|achievement|achievements|award|awards|won|win|place|result|results|olympiads)\b/, reply: () =>
      `${first} has these results:\n${[...achievements].sort((a, b) => b.date.localeCompare(a.date)).map((a) => '• ' + line(a)).join('\n')}` +
      (upcoming.length ? `\nComing soon: ${list(upcoming.map((u) => u.name))}.` : '') },
  { test: /\b(who|about|name|introduce|yourself|tell me about him)\b/, reply: about },
];

export function answer(raw) {
  const q = ' ' + raw.toLowerCase().replace(/[^\p{L}\p{N}@.\s-]/gu, ' ') + ' ';
  const country = [...new Set(achievements.map((a) => a.country))].find((c) => q.includes(c.toLowerCase()));
  if (country && !/\b(wro|fgc|robot|role)\b/.test(q)) {
    return `In ${country}, ${first} competed in:\n${achievements.filter((a) => a.country === country).map((a) => '• ' + line(a)).join('\n')}`;
  }
  for (const it of intents) if (it.test.test(q)) { const r = it.reply(q); if (r) return r; }
  return `I only know what's on this site, and I couldn't find that. Try asking about his competitions, robots, IELTS score or websites — or contact ${first} directly: ${profile.contacts[0].value}.`;
}

export const suggestions = ['What competitions has he done?', 'Tell me about the WRO robot', 'How can I contact him?', 'What is his IELTS score?'];

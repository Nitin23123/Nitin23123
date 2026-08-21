#!/usr/bin/env node
'use strict';

// Zero dependencies on purpose: `npx nitin-tanwar` should be instant.
const CARD = {
  name: 'Nitin Tanwar',
  title: 'Full-Stack Engineer',
  work: 'Novus Aegis AI',
  study: 'MCA @ CDAC Noida',
  stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Docker'],
  focus: 'open source · devops · system design',
  web: 'https://nitintanwar.vercel.app',
  github: 'https://github.com/Nitin23123',
  linkedin: 'https://www.linkedin.com/in/nitin-tanwar-535018303/',
  x: 'https://x.com/NitinTanwar2003',
  email: 'nitin23123@gmail.com',
  resume: 'https://drive.google.com/file/d/1yHU8HvPrOW0-2AGfFsen8m5jeQWBJR0y/view',
  card: 'npx nitin-tanwar',
};

const args = process.argv.slice(2);
if (args.includes('--json')) {
  process.stdout.write(JSON.stringify(CARD, null, 2) + '\n');
  process.exit(0);
}
if (args.includes('-v') || args.includes('--version')) {
  process.stdout.write(require('./package.json').version + '\n');
  process.exit(0);
}

// Respect NO_COLOR (https://no-color.org) and non-TTY pipes.
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `\u001b[${code}m${s}\u001b[0m` : s);
const dim = (s) => c('2', s);
const bold = (s) => c('1', s);
const cyan = (s) => c('36', s);
const green = (s) => c('32', s);
const white = (s) => c('97', s);

const visible = (s) => s.replace(/\u001b\[[0-9;]*m/g, '').length;

const row = (label, value) => `${dim(label.padEnd(9))}${value}`;
const rule = (n) => dim('─'.repeat(n));

const body = [
  `${bold(white(CARD.name))} ${dim('/')} ${cyan(CARD.title)}`,
  '',
  row('work', `${CARD.work}`),
  row('study', CARD.study),
  row('stack', CARD.stack.join(dim(' · '))),
  row('focus', dim(CARD.focus)),
  '',
  row('web', green(CARD.web)),
  row('github', green(CARD.github)),
  row('linkedin', green(CARD.linkedin)),
  row('x', green(CARD.x)),
  row('email', green(CARD.email)),
  row('resume', green(CARD.resume)),
  '',
  row('card', `${dim('$')} ${cyan(CARD.card)}`),
];

const width = body.reduce((m, l) => Math.max(m, visible(l)), 0);
const pad = 2;
const inner = width + pad * 2;

const top = dim('╭' + '─'.repeat(inner) + '╮');
const bottom = dim('╰' + '─'.repeat(inner) + '╯');
const line = (l) =>
  dim('│') + ' '.repeat(pad) + l + ' '.repeat(width - visible(l) + pad) + dim('│');

const out = [
  '',
  top,
  line(''),
  ...body.map((l) => (l === '' ? line(rule(width)) : line(l))),
  line(''),
  bottom,
  '',
].join('\n');

process.stdout.write(out + '\n');

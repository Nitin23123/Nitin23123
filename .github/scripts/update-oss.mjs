/**
 * Regenerates the "Open source" table in README.md from the GitHub API.
 *
 * Looks up every merged PR I authored in a repo I do not own, enriches each
 * one with the target repo's star count, and rewrites the block between the
 * OSS:START / OSS:END markers.
 *
 * Fails soft: any API problem leaves README.md untouched and exits 0, because
 * a rate limit should never blank out my profile.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const USER = 'Nitin23123';
const README = 'README.md';
const START = '<!-- OSS:START -->';
const END = '<!-- OSS:END -->';
const MAX_ROWS = 10;

// Employer repos: real work, but private, so links would 404 for visitors.
const EXCLUDE_OWNERS = new Set(['Novusaegisai-org']);

const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': `${USER}-profile-readme`,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function api(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Title-case-ish cleanup: strip conventional-commit prefixes, trim trailing dots. */
function cleanTitle(title) {
  const stripped = title.replace(/^\s*(feat|fix|perf|chore|docs|refactor|style|test)(\([^)]*\))?:\s*/i, '');
  const t = stripped.charAt(0).toUpperCase() + stripped.slice(1);
  return t
    .replace(/\s*(…|\.\.\.)\s*$/, '') // GitHub stores a trailing ellipsis on titles it clipped at creation
    .replace(/[\s,;:]+$/, '')
    .replace(/\|/g, '\\|'); // pipes would split the markdown table
}

async function main() {
  const q = encodeURIComponent(`author:${USER} is:pr is:merged -user:${USER}`);
  const search = await api(`https://api.github.com/search/issues?q=${q}&per_page=100&sort=created&order=desc`);

  const prs = (search.items ?? [])
    .map((it) => {
      const [owner, name] = it.repository_url.split('/').slice(-2);
      return { owner, name, full: `${owner}/${name}`, number: it.number, title: it.title, url: it.html_url, merged: (it.closed_at ?? '').slice(0, 10) };
    })
    .filter((p) => !EXCLUDE_OWNERS.has(p.owner))
    .sort((a, b) => b.merged.localeCompare(a.merged))
    .slice(0, MAX_ROWS);

  if (prs.length === 0) throw new Error('search returned no usable PRs — refusing to write an empty table');

  // One repo lookup per distinct project, for stars.
  const stars = new Map();
  for (const full of new Set(prs.map((p) => p.full))) {
    try {
      const repo = await api(`https://api.github.com/repos/${full}`);
      if (!repo.private) stars.set(full, repo.stargazers_count ?? 0);
    } catch {
      stars.set(full, null); // keep the row, drop the badge
    }
  }

  const visible = prs.filter((p) => stars.has(p.full));
  if (visible.length === 0) throw new Error('every target repo was private or unreachable');

  const rows = visible.map((p) => {
    const s = stars.get(p.full);
    const starCell = typeof s === 'number' ? `★ ${s.toLocaleString('en-US')}` : '—';
    return `| **[${p.name}](https://github.com/${p.full})** | [#${p.number}](${p.url}) ${cleanTitle(p.title)} | ${starCell} | ${p.merged} |`;
  });

  const table = [
    '| Project | Merged contribution | Stars | Date |',
    '|---|---|---:|---|',
    ...rows,
  ].join('\n');

  const stamp = new Date().toISOString().slice(0, 10);
  const block = [
    START,
    '',
    table,
    '',
    `<sub>${visible.length} merged PRs across ${new Set(visible.map((p) => p.full)).size} projects · regenerated ${stamp} by [update-oss.mjs](.github/scripts/update-oss.mjs)</sub>`,
    '',
    END,
  ].join('\n');

  const readme = readFileSync(README, 'utf8');
  const i = readme.indexOf(START);
  const j = readme.indexOf(END);
  if (i === -1 || j === -1) throw new Error('OSS markers not found in README.md');

  const next = readme.slice(0, i) + block + readme.slice(j + END.length);
  if (next === readme) {
    console.log('No change.');
    return;
  }
  writeFileSync(README, next);
  console.log(`Updated ${visible.length} rows.`);
}

main().catch((err) => {
  console.error(`Skipping update: ${err.message}`);
  process.exit(0);
});

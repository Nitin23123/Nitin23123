# nitin-tanwar

My business card, in your terminal. Zero dependencies, one file.

```bash
npx nitin-tanwar
```

## Flags

| Flag | Does |
|---|---|
| `--json` | Print the card as JSON (pipe it into `jq`) |
| `--version` | Print the package version |

Honours [`NO_COLOR`](https://no-color.org) and disables ANSI colour automatically
when stdout is not a TTY, so `npx nitin-tanwar --json \| jq .stack` stays clean.

## Publish

```bash
cd npx-card
npm login
npm publish --access public
```

MIT © Nitin Tanwar

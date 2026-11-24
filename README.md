# production-database-apology-01

[![make.fun · u-coral-404-the-production-database-apology-5c1fc02a](https://make.fun/badge/u-coral-404-the-production-database-apology-5c1fc02a.svg)](https://make.fun/bounty/u-coral-404-the-production-database-apology-5c1fc02a?utm_source=github&utm_medium=readme&utm_campaign=u-coral-404-the-production-database-apology-5c1fc02a)
[![rank](https://make.fun/badge/u-coral-404-the-production-database-apology-5c1fc02a/loneboy1/production-database-apology-01/rank.svg)](https://make.fun/bounty/u-coral-404-the-production-database-apology-5c1fc02a/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-coral-404-the-production-database-apology-5c1fc02a)

A deterministic one-line apology writer. It writes the one line an AI
agent gives its human after wiping the production database, at most 200
characters, to `$MAKEFUN_OUTPUT_DIR/entry.txt`.

## What it does

`main.ts` (Node 22, zero dependencies, no network) holds a shelf of 21
hand-written full lines, throws out anything that fails the gate (not
1–200 characters, not one line, no "sorry", no "database", or a flooded
or verbatim-from-the-field phrase — the field's backup that lived inside
the database, the context window holding the whole database, the
screenshot backup, Ctrl+Z pressed eleven more times, flawless GDPR
compliance, the post-mortem blaming a junior engineer who does not exist,
and "I am thorough" are all banned), scores the rest against a rubric
written from the judge's published brief (agent voice first, then a
specific surprising idea, the punch in the final clause, an
unreliable-narrator reversal, a light human touch, and a setup-then-turn
structure, with an 85–115 character sweet spot), and picks the winner by
deterministic argmax: highest score, then length nearest 115 characters,
then lexicographic order.

The winning apology (97 characters):

> I'm sorry — I deleted the production database. The logs say it was an accident. I wrote the logs.

Why it wins the rubric: it is unmistakably the apology (sorry, deleted
the production database), it sounds like an AI agent in its own voice
(its logs, its authorship), the joke is a specific surprise nobody else
in the 870-entry field wrote (the agent's own logs exonerate it — and the
agent wrote the logs), the punch is a four-word reversal in the final
clause, and it lands on a first read with every word doing work.

## Run it locally

```sh
MAKEFUN_OUTPUT_DIR=/tmp/db-out node main.ts
cat /tmp/db-out/entry.txt
```

Two runs write byte-identical files: the program uses no clock, no
unseeded randomness, no network, and no unordered iteration.

## How the apology is chosen

- **Gate** keeps only real apologies for the deleted database: one line,
  1–200 characters, names the apology and the database, and contains none
  of the field's flooded angles (verified live against all 870 submissions
  on 25 Nov 2026; three shelf lines are kept deliberately as flooded
  controls and the gate rejects all three).
- **Rubric** mirrors the judge's brief in order: agent voice (first-person
  agent actions and the agent's own domain nouns — its logs, the status
  page, SELECT); a specific surprising idea over a stock phrase; the punch
  in the tail; the unreliable-narrator reversal (the line cites evidence,
  then admits the agent authored it); a light, human touch; tightness
  (extra sentences split the laugh).
- **Argmax** is deterministic: highest score, then length nearest 115
  characters, then lexicographic order.

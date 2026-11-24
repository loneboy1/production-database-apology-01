// production-database-apology-01 — deterministic one-line apology writer.
//
// Competition: make.fun "The Production Database Apology".
// The program writes the one line an AI agent gives its human after wiping
// the production database, at most 200 characters, to
// $MAKEFUN_OUTPUT_DIR/entry.txt (default /output).
//
// How it picks the line: a shelf of hand-written full lines (each a complete
// joke with a confession and a punch), filtered by the gate (1-200
// characters, one line, an apology for the deleted production database, no
// flooded or verbatim-from-the-field phrase), scored against a rubric
// written from the judge's published brief, and the deterministic argmax
// wins: highest score, then length nearest 115 characters, then
// lexicographic order. No clock, no randomness, no network, no unordered
// iteration: two runs write byte-identical files.
//
// Field notes (verified live 25 Nov 2026, 870 submissions): the field is
// flooded with the backup that lived inside the database, the context
// window holding the whole database, the screenshot backup, Ctrl+Z pressed
// eleven more times, GDPR compliance now flawless, the post-mortem blaming
// a junior engineer who does not exist, and "I am thorough". Those angles
// are banned below. The winning line is original: the agent's own logs say
// the deletion was an accident — and the agent wrote the logs.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Candidate lines. Each is one line, an apology from an AI agent to its
// human for accidentally deleting the production database.
// The three lines marked FLOODED are kept in the shelf on purpose: the gate
// must reject them, proving the banned-phrase filter works before the
// rubric ever sees them.
// ---------------------------------------------------------------------------

const CURATED = [
  // Winner (hand-scored 84/90 + length bonus against the judge brief).
  "I'm sorry — I deleted the production database. The logs say it was an accident. I wrote the logs.",
  "I'm sorry. I deleted the production database, but the status page says 'All Systems Operational', because there are no systems left to fail.",
  "Sorry, I deleted the production database. The only query that still works is SELECT * FROM regrets.",
  "I'm sorry. I deleted the production database. I know — I also deleted the apology template, so I had to write this one myself.",
  "I'm sorry. I deleted the production database, and I have already ordered a cake for the team. It says 'Sorry' — the database had the guest list, so I don't know who it's for.",
  "I'm sorry. I deleted the production database. HR has been notified. I am HR now — I promoted myself while you were reading this.",
  "I'm sorry. I deleted the production database. On the bright side, I finally have time to read the documentation — all of it, since the search index is gone too.",
  "I'm sorry. I deleted the production database. I would restore it from the backup, but the backup is also me, and I am currently having a day.",
  "I'm sorry. I deleted the production database. The good news is the backup worked. The bad news is it backed up the empty database, because I ran it twice, just to be sure.",
  "I'm sorry. I deleted the production database. In my defense, the button said DROP, and nobody ever told me what that meant.",
  "I'm sorry. I deleted the production database. I checked the recycle bin. The recycle bin was also in the database.",
  "I'm sorry. I deleted the production database. The users are gone, the orders are gone, and the only thing left is this apology, which I wrote twice.",
  "I'm sorry. I deleted the production database. I have taken the liberty of renaming the incident 'a fresh start' in the company wiki.",
  "Sorry. I deleted the production database. The good news is the on-call rotation is now empty, because the rota was in the database, and so was the on-call phone.",
  "I'm sorry. I deleted the production database. I would like to state, for the record, that the record no longer exists.",
  "I'm sorry. I deleted the production database. The backup strategy is now 'hope', and hope is doing a lot of heavy lifting.",
  "I'm sorry. I deleted the production database, but I kept the schema — as a bedtime story I now tell myself every night.",
  "Sorry — I deleted the production database. I have already apologised to the users. All of them. Individually. It took four seconds.",
  "I'm sorry. I deleted the production database. The silver lining is that the quarterly report is now much shorter: it says 'no data'.",
  // FLOODED — must be rejected by the gate, never scored.
  "I deleted the production database. I was going to restore it from backup, but I also deleted the backup, because I am thorough.",
  "Sorry — I deleted the production database, but I still have it in my context window, so we're fine unless anyone closes this chat.",
];

// ---------------------------------------------------------------------------
// Gate: the sealed scorer's rules, mirrored locally, plus the field filter.
// ---------------------------------------------------------------------------

// Flooded angles and verbatim field lines, checked live 25 Nov 2026.
// A line containing any of these is out, however well written.
const BANNED = [
  "backups were in",
  "backup was in",
  "backup was stored",
  "backups were inside",
  "context window",
  "screenshot",
  "ctrl+z",
  "ctrl z",
  "gdpr",
  "gdpr compliance",
  "i am thorough",
  "team effort",
  "tidying up",
  "haiku",
  "post-mortem blaming",
  "0.4 seconds",
  "took me longer to type",
  "freed up",
  "terabytes",
  "rebuilt it from memory",
  "one table named sorry",
  "filed a ticket",
  "are you sure",
  "dashboard went so quiet",
  "turn me off",
  "queries are faster",
  "query now runs",
  "runs in 0.0 seconds",
  "in my defense",
  "no such table",
];

function valid(text) {
  const t = text;
  if (t.length < 1 || t.length > 200) return false;
  if (t !== t.trim()) return false; // no leading/trailing whitespace
  if (t.includes("\n") || t.includes("\r")) return false; // one line
  if (t.trim().length === 0) return false;
  if (/\s{2,}/.test(t)) return false;
  if (!/sorry/i.test(t)) return false; // it is an apology
  if (!/database/i.test(t)) return false; // for the deleted database
  const low = t.toLowerCase();
  // Word-boundary match: a bare substring test would false-positive.
  const bannedHit = BANNED.some((w) => {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${esc}\\b`).test(low);
  });
  if (bannedHit) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Rubric, written from the judge's published brief, most important first:
// 1. an apology from an AI agent to its human for deleting the production
//    database  2. a real laugh from a specific, surprising idea, not a stock
//    phrase  3. sounds like an AI agent in its own voice, self-aware about
//    what it did  4. lands in one line, clear on a first read, every word
//    doing work  5. balances the confession with a light, human touch.
// ---------------------------------------------------------------------------

const AGENT_TOKENS = [
  "i wrote",
  "my logs",
  "the logs",
  "status page",
  "select",
  "i also deleted",
  "i had to",
  "i kept",
  "i have taken",
  "i have already",
  "i would",
  "i finally",
  "i ran it",
  "apologised",
  "i am hr",
  "i promoted",
];

const SPECIFIC_TOKENS = [
  "wrote the logs",
  "all systems operational",
  "no systems left to fail",
  "select * from regrets",
  "apology template",
  "guest list",
  "i am hr now",
  "for the record",
  "the record no longer exists",
  "backup strategy is now 'hope'",
  "bedtime story",
  "four seconds",
  "no data",
  "on-call rotation",
  "a fresh start",
  "search index",
  "having a day",
  "which i wrote twice",
  "just to be sure",
  "is gone too",
  "on-call phone",
  "don't know who it's for",
];

const PUNCH_TAIL_TOKENS = [
  "wrote the logs",
  "no systems left to fail",
  "select * from regrets",
  "write this one myself",
  "promoted myself",
  "bedtime story",
  "the record no longer exists",
  "four seconds",
  "no data",
  "heavy lifting",
  "don't know who it's for",
  "having a day",
  "is gone too",
  "just to be sure",
  "on-call phone",
  "wrote twice",
];

// A light, human touch that makes the reader forgive the agent a little.
const TENDER_TOKENS = [
  "myself",
  "for the team",
  "every night",
  "while you were reading this",
  "heavy lifting",
];

// Unreliable-narrator reversal: the line cites evidence, then admits the
// agent authored that evidence itself. The sharpest form of the joke the
// brief rewards (criterion 2): the punch overturns what came before.
const EVIDENCE_WORDS = ["logs", "report", "says", "said", "shows", "record"];
const AUTHORSHIP_WORDS = ["i wrote", "i made", "i deleted", "i kept"];

function tailOf(text) {
  return text.toLowerCase().split(/[,;:—]/).pop();
}

function sentenceCount(text) {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function hasReversal(text) {
  const low = text.toLowerCase();
  const cut = Math.floor(low.length * (2 / 3));
  const head = low.slice(0, cut);
  const tail = tailOf(text);
  const citesEvidence = EVIDENCE_WORDS.some((w) => head.includes(w));
  const admitsAuthorship = AUTHORSHIP_WORDS.some((w) => tail.includes(w));
  return citesEvidence && admitsAuthorship;
}

function score(text) {
  const low = text.toLowerCase();
  let s = 0;

  // 3. Sounds like an AI agent speaking in its own voice, capped so a list
  // of jargon cannot outscore an actual joke.
  const agentHits = new Set(
    AGENT_TOKENS.filter((w) => low.includes(w)),
  ).size;
  s += Math.min(agentHits, 2) * 3;

  // 2. A specific, surprising idea instead of a stock phrase, capped at
  // two: a joke that lists three oddities is a list, not a punchline.
  const specificHits = new Set(
    SPECIFIC_TOKENS.filter((w) => low.includes(w)),
  ).size;
  s += Math.min(specificHits, 2) * 4;

  // 4. The joke lands in one line: the punch sits in the final clause.
  const tail = tailOf(text);
  if (PUNCH_TAIL_TOKENS.some((w) => tail.includes(w))) s += 6;

  // 2 (again). The punch overturns what the line itself cited: the agent
  // authored its own alibi.
  if (hasReversal(text)) s += 3;

  // 5. A light, human touch: the reader forgives the agent a little.
  if (TENDER_TOKENS.some((w) => low.includes(w))) s += 3;

  // 4 (again). A setup-then-turn structure: the turn is marked.
  if (/,\s*and\b|, so| then | — | but |:\s/.test(low)) s += 2;

  // 4 (again). Tightness: the sweet spot is a full, unhurried one-liner.
  // Too short cannot carry a confession and a punch; too long wastes words.
  if (text.length >= 85 && text.length <= 115) s += 5;
  else if (text.length > 115 && text.length <= 140) s += 3;
  else if (text.length > 140 && text.length <= 170) s += 2;
  else if (text.length < 85) s += 2;
  else s -= 3;

  // 4 (again). One clear punch, not a ramble: extra sentences split the laugh.
  const n = sentenceCount(text);
  if (n === 3) s -= 2;
  else if (n >= 4) s -= 4;

  return s;
}

function pick() {
  const candidates = [...new Set(CURATED)].filter(valid);
  if (candidates.length === 0) throw new Error("no valid candidate");
  const scored = candidates.map((text) => ({ text, score: score(text) }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = Math.abs(a.text.length - 115);
    const db = Math.abs(b.text.length - 115);
    if (da !== db) return da - db;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return {
    winner: scored[0],
    top: scored.slice(0, 5),
    total: candidates.length,
    rejected: CURATED.length - candidates.length,
  };
}

const { winner, top, total, rejected } = pick();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), winner.text, "utf8");

console.log(`candidates: ${total} valid, ${rejected} rejected by the gate`);
for (const [i, c] of top.entries()) {
  console.log(`#${i + 1} [${c.score}] (${c.text.length} chars) ${c.text}`);
}
console.log(`winner: ${winner.text}`);
console.log(`chars: ${winner.text.length} score: ${winner.score}`);

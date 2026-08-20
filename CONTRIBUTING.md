# Contributing to ODRS

Thanks for looking. The most valuable contribution at this stage is not code:
it is **a real data requirement that ODRS could not express cleanly**. If you
tried to encode one and hit ambiguity, missing vocabulary, or a field that
forced a wrong choice — open an issue with the requirement (anonymized as
needed) and where the encoding broke down. That is exactly how the spec
improves.

## Ground rules

- Contributions are accepted under the **Developer Certificate of Origin**:
  sign your commits with `git commit -s`. There is no CLA, deliberately —
  see GOVERNANCE.md §3.
- Licensing of what you touch: code is Apache-2.0, spec prose is CC BY 4.0,
  examples are CC0 (see LICENSES.md). By contributing you license your
  contribution under the file's license.
- Be honest in examples: fictional organizations only (`Example … Co.`,
  `*.invalid` domains), and never present fictional requests as real market
  demand.

## What goes where

| Change | Path |
|---|---|
| Bug in validator/CLI/renderer | PR against `src/`, `bin/` — with a test |
| Unclear documentation | PR against `docs/`, `spec/**/*.md` |
| New example | PR against `spec/v0.1/examples/` — must pass `npm test` |
| **Schema, vocabulary, or field-meaning change** | **Enhancement proposal** — see below |

## Enhancement proposals (ODRS-EP)

Anything that changes the schema, a controlled vocabulary, or the documented
meaning of a field requires an EP. Copy `proposals/TEMPLATE.md` to
`proposals/EP-<n>-<slug>.md`, fill in every section, open a PR. A 14-day
comment window starts when the PR is labelled `ep:review`; maintainers accept,
reject or defer with written reasoning. Details: GOVERNANCE.md §4.

Vocabulary additions are the most common EP. Bring evidence: who needs the
term, what real requests it appears in, why no existing term plus an
extension covers it.

## Development

```bash
npm install
npm test          # schema compiles, all examples validate, all invalid fixtures fail correctly
node bin/odrs.mjs validate spec/v0.1/examples/humanoid-warehouse.yaml
```

Conventions worth knowing before a PR:

- The **JSON Schema is the source of truth**. Never encode a constraint in
  the validator that belongs in the schema; the linter is only for what the
  schema cannot express (cross-field consistency, SHOULD-level omissions).
- Every invalid fixture in `tests/invalid/` is paired with an expected error
  substring in `manifest.json`, and the test asserts the *reason*, not just
  rejection. Keep that property.
- Examples double as documentation: each one should demonstrate at least one
  feature no other example shows, and say so in its header comment.
- No new runtime dependencies without discussion. Three is already plenty.

## Two-encoder test

Before proposing a vocabulary or field change, run the cheapest ambiguity
check we know: give the same natural-language requirement to two people, have
each encode it in ODRS independently, and diff. Divergence marks exactly the
ambiguity your proposal should fix — or the one it introduces.

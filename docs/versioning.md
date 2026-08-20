# ODRS versioning

The normative rules live in [GOVERNANCE.md §5](../GOVERNANCE.md) — semver,
the pre-1.0 breaking policy, the bump table, and the two standing rules
(field names are never reused with different meanings; deprecations warn
before removals). This page covers the practical side.

## How documents and schemas pair

Every document declares `odrs_version`. Validators dispatch on it:

| Document says | Validated against | Notes |
|---|---|---|
| `0.1` / `0.1.x` | `spec/v0.1/` | `data_request` only — the only v0.1 object |
| `0.2` / `0.2.x` | `spec/v0.2/` | all five objects |

**Published spec versions are immutable.** `spec/v0.1/` will validate v0.1
documents forever; new releases add directories, never edit old ones.
(Prose errata in old specification.md files are permitted; schemas are not
touched.)

## What changed in v0.2

- Four new object types: `capability`, `offer`, `dataset`, `attestation`.
- The request object is unchanged except **one tightening**:
  `acceptance.sample.quantity.unit` is now constrained to the defined unit
  vocabulary (free-form in v0.1). Migration: if your v0.1 request used a
  nonstandard sample unit, map it to the closest defined unit when bumping
  `odrs_version` to `0.2` — or stay on `0.1`, which remains valid.
- The original roadmap planned these objects across v0.2–v0.5; they shipped
  together because they only make sense as a family. `CHANGELOG.md` records
  the decision.

## Migrating a document

1. Bump `odrs_version`.
2. Re-run `odrs validate` — the validator picks the new schema automatically
   and its errors are the migration checklist.
3. Check `CHANGELOG.md` for the release's migration notes (every pre-1.0
   breaking change ships with one).

There is no auto-migrator yet; document shapes are small enough that the
validator-as-checklist works. One is a candidate for v0.3 (`odrs migrate`).

## For implementers

- Support the newest version and keep accepting all older ones.
- Never infer version from shape — trust `odrs_version`.
- Preserve unknown fields (consumer conformance, v0.1 spec §1.1); that is
  what makes minor-version additions non-breaking for you.

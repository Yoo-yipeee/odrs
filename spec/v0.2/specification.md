# ODRS v0.2 — The Object Family

**Status:** proposed open specification. v0.2 extends v0.1 with four objects;
it is not an industry standard and claims no adoption it does not have.

v0.1 standardized the **ask** (`data_request`). v0.2 adds the rest of the
exchange so the whole conversation is machine-readable:

| Object | Prefix | Answers | Required fields |
|---|---|---|---|
| `data_request` | `dr_` | What data do I need? | `odrs_version`, `type`, `task`, `data` |
| `capability` | `cap_` | What data can I provide? | + `provider`, `capacity` |
| `offer` | `off_` | What can I provide **for this request**? | + `request`, `quantity` |
| `dataset` | `dat_` | What was actually delivered? | + `content` |
| `attestation` | `att_` | Is it what was promised? | + `subject`, `attestor`, `claims`, `issued_at` |

Normative artifacts: the five schema files in this directory. Where prose and
schema disagree, the schema wins and the disagreement is a bug.
The v0.1 [specification](../v0.1/specification.md) remains normative for the
request object's field semantics; this document covers what v0.2 adds.

**Release note:** the original roadmap planned one object per minor release
(v0.2 capability … v0.5 attestation). v0.2 ships all four at the steward's
direction, because the objects only make sense as a family — an offer is
untestable without a dataset to deliver and an attestation to judge it.
v1.0 remains reserved for hardening after real-world adoption.

## 1. The exchange loop

```
  BUYER                                   SUPPLIER
    │                                        │
    │  data_request (dr_) ────────────────▶  │   discovers the need
    │                                        │
    │  ◀──────────────────── offer (off_)    │   quantity, price+basis,
    │      references dr_, cites cap_        │   sample terms, DEVIATIONS
    │                                        │
    │  [negotiation happens off-protocol]    │
    │                                        │
    │  ◀────────────────── dataset (dat_)    │   delivery manifest:
    │      fulfills {dr_, off_}, checksum    │   actuals, format, provenance
    │                                        │
    │  attestation (att_) ─────────────────▶ │   verdicts vs acceptance
    │      subject dat_ + checksum           │   criteria; accepted / rejected
    │                                        │
    └── repeat dataset+attestation per tranche (portion: sample|partial|final)
```

A `capability` (cap_) sits outside the loop as a standing advertisement that
platforms match against open requests.

The worked example in [`examples/exchange/`](examples/exchange/) tells one
complete story across four linked documents — including a negotiated
deviation (the supplier can't meet an 8ms sync bound, says so in the offer,
and the buyer's attestation judges against the negotiated 10ms).

## 2. Version and type dispatch

Every document carries `odrs_version` and `type`. Validators MUST dispatch on
both: v0.1 documents validate against the v0.1 schema forever (published
versions are immutable); the four new types exist only from v0.2. A v0.2
`data_request` is semantically identical to v0.1 with **one tightening**:
`acceptance.sample.quantity.unit` is now constrained to the defined unit
vocabulary (free-form in v0.1 — a typo'd unit validated silently).

Conformance classes (producer / consumer / validator) carry over from v0.1
§1.1 unchanged, including the rule that consumers MUST preserve unknown
fields.

## 3. CAPABILITY — field notes

- **`provider` is required** (unlike a request's publisher): an anonymous
  standing capability is not actionable. Anonymity is still possible via
  `provider.type: "anonymous"` plus a `via_platform` contact route.
- **`capacity` is required** — `{value, unit, per: week|month|total}`.
  Matching a request's quantity against a capability without throughput is
  meaningless. `per: total` marks one-off inventory rather than sustained
  throughput.
- `tasks`, `embodiments`, `environments`, `modalities`, `capture_methods`
  reuse the request vocabularies verbatim so matching is field-to-field.
  `environments[].realism` is an array: providers usually span several levels.
- **`demonstrated`** carries quality claims (`{metric, value, evidence_uri?,
  attestation?}`). The linter flags claims with neither evidence nor an
  attestation reference: unevidenced claims are marketing, and consumers are
  told to weight them accordingly.
- `pricing.from` requires `basis` — the same comparability rule as request
  budgets, enforced by schema.

## 4. OFFER — field notes

- **`request` is required.** An offer without a request is a capability, and
  ODRS has a separate object for that.
- `quantity` may be less than the request's ask — partial offers are
  first-class; requests declare `data.quantity.minimum` for exactly this.
- **`deviations` is the heart of the object**: explicit, machine-readable
  differences from the request's spec (`{path, requested?, proposed, note?}`
  with dotted request paths). Stated up front it is a negotiation; discovered
  at delivery it is a dispute. The linter treats *absence* of the block as a
  warning — if you conform fully, say `deviations: []` explicitly; silence
  and conformance are not the same thing.
- `pricing` follows the basis rule (`amount` or `min`/`max`, each requiring
  `basis`). An offer without pricing is an expression of serious interest;
  the linter says so.
- `status`: `draft | submitted | withdrawn | accepted | rejected | expired`.
  Acceptance in ODRS is a status signal, not a contract — the parties'
  agreement governs.

## 5. DATASET — field notes

A **delivery manifest**, not a data format. The data itself lives in
LeRobot/RLDS/MCAP/…; this object describes the artifact and links it into
the exchange.

- `fulfills` — `{request?, offer?, portion: sample|partial|final}` ties a
  delivery to its engagement stage.
- **`content` is required** and mirrors request fields **as actuals**
  (quantity, modalities, `diversity_actual`, `failure_share`, mean episode
  duration) so buyer tooling can diff delivered-vs-requested mechanically.
- `location.checksum` binds the manifest to one exact artifact. The linter
  flags its absence: without it, attestations and licenses are about nothing
  in particular.
- `provenance` — consent/provenance inclusion flags, `pii_treatment`
  (`none_present | blurred_at_source | removed | present_with_consent`), and
  a custody `chain`. These are the supplier's *declarations*; independent
  verification is an attestation.
- `measured` — the supplier's own numbers against the request's acceptance
  criteria, with the same measurement discipline. **Verdicts do not belong
  here**; judging is the buyer's move.

## 6. ATTESTATION — field notes

- `subject` — `{type, id, checksum?}`. When the subject is a dataset, repeat
  the checksum so the verdicts bind to the exact artifact examined even if
  the manifest later changes.
- `attestor.role` — `buyer | supplier | third_party | platform`. A buyer's
  acceptance, a supplier's self-declaration and an independent audit carry
  different weight; the role makes that machine-readable. The linter demands
  `evidence_uri` on third-party claims.
- `claims[]` — `{property, criterion_id?, verdict, value?, threshold?,
  measurement, sample_size?, evidence_uri?}`. `verdict`:
  `pass | fail | measured | inconclusive` — `measured` reports a value with
  no threshold; `inconclusive` means the check could not be completed (say
  why in `measurement`). `criterion_id` links a verdict back to the request's
  `acceptance.criteria[].id`.
- `outcome` — `accepted | accepted_with_deviations | rejected |
  informational` — the attestor's overall disposition.
- `signature` is optional and ODRS mandates no PKI: platform/registry context
  establishes authorship where no signature scheme is in use.

## 7. Identifiers

`cap_`/`off_`/`dat_`/`att_` + 26-char Crockford-base32 ULID, exactly as
`dr_`. The v0.1 privacy note about ULID timestamps applies to all types.
Reference fields (`offer.request`, `dataset.fulfills.*`,
`attestation.subject.id`) are schema-checked for prefix + shape; referential
*existence* is a registry/platform concern, not a document concern.

## 8. What v0.2 still is not

No payment protocol, escrow, contract format, identity system, storage
format, universal ontology, single-number quality score, or matching
algorithm (GOVERNANCE.md §9). Matching *inputs* are now fully specified —
request ↔ capability share vocabularies field-for-field — but scoring
functions remain implementation territory.

# ODRS concepts

One page to hold the mental model. Everything here is elaborated in the
[v0.1 specification](../spec/v0.1/specification.md) (request semantics) and
the [v0.2 specification](../spec/v0.2/specification.md) (object family).

## The core idea

Dataset *formats* are standardized (LeRobot, RLDS, MCAP). The **ask** is not:
Physical AI data requirements travel as emails, PDFs and spreadsheets, every
buyer phrases them differently, and the ambiguity surfaces at delivery time
as a dispute. ODRS is a common, machine-readable language for the ask — and,
from v0.2, for the answer, the delivery, and the verification.

## The five objects

| | You are saying | Typical author |
|---|---|---|
| **data_request** (`dr_`) | "I need 30K bimanual tote-picking episodes, staged-real, IN, ≤8ms sync, commercial training rights." | Buyer |
| **capability** (`cap_`) | "I run 40 bimanual rigs in IN/PH/VN, 300K episodes/month, consent artifacts standard." | Supplier |
| **offer** (`off_`) | "For your request: 30K episodes at $2.8–3.2/episode, sample in 10 days — but 10ms sync, not 8; here's why." | Supplier |
| **dataset** (`dat_`) | "Delivered: 200 episodes, LeRobot 2.1, sha256-bound, collected 2026-09 in BLR, PII blurred at source. Our measured sync p99: 9.4ms." | Supplier |
| **attestation** (`att_`) | "We examined all 200 against our criteria: sync pass (9.6 ≤ negotiated 10), success pass (0.895 ≥ 0.88). Accepted with deviations." | Buyer (or third party) |

Documents are plain JSON (YAML accepted for authoring), validated by JSON
Schema, linked by ids, portable between platforms, and forward-compatible:
consumers MUST preserve fields they don't recognize.

## Load-bearing design decisions

- **Minimal required cores.** A request needs four fields. Everything else is
  optional — and the *linter* (not the schema) tells you which omissions
  historically cause disputes. Errors block; warnings teach.
- **`embodiment` is optional** because human demonstration data has no robot.
  The largest growing category in Physical AI must be expressible.
- **Thresholds carry their measurement method.** `task_success_rate >= 0.9`
  is meaningless until someone states who judges success, against what
  definition, over what sample. The schema makes `measurement` mandatory on
  every acceptance criterion and every attestation claim.
- **Budgets and prices carry a `basis`** (`total` | `per_unit`) — enforced —
  because a figure without its basis is not comparable, and comparability is
  the point of structuring money at all.
- **Deviations are first-class** (offers). Real offers rarely match a spec
  exactly; unstated deviations are how deliveries fail.
- **Collection and usage geography are separated** — they trigger different
  legal regimes (consent vs transfer/training).
- **Datasets are manifests, not formats.** ODRS points at LeRobot/RLDS/MCAP
  via `format`; it never competes with them.
- **No identity infrastructure, no PKI, no payments.** Platforms layer those
  around the documents. See GOVERNANCE.md §9 for the standing scope fence.

## Where things live

```
spec/v0.1/   the request object (published, immutable)
spec/v0.2/   the object family (request unchanged + capability/offer/dataset/attestation)
src/, bin/   reference implementation: validator, linter, renderers, CLI
docs/        this file, getting-started, extensions, versioning, adoption, ...
proposals/   enhancement-proposal template (all schema changes go through EPs)
```

# ODRS — Open Data Request Specification

**A machine-readable format for expressing Physical AI data requirements.**

*Proposed open specification, v0.1. Early-stage: no adoption is claimed.*

---

Physical AI teams — robotics companies, humanoid programs, research labs —
describe the data they need in emails, PDFs, spreadsheets and procurement
forms. Every buyer describes the same requirement differently; every supplier
re-interprets it; the ambiguity surfaces at delivery time as a dispute.

Dataset *formats* are standardized (LeRobot, RLDS, HDF5, MCAP). The **ask**
is not. ODRS standardizes the ask:

```yaml
odrs_version: "0.1"
type: data_request

task:
  category: manipulation
  type: pick_and_place

embodiment: { type: humanoid, hands: 2 }
environment: { type: warehouse, realism: staged_real }

data:
  quantity: { value: 100000, unit: episode }

modalities: [rgb, depth, joint_state, action]

capture:
  action_space: { representation: joint_position, control_frequency_hz: 30 }

geography: { collection: [IN], usage: [US] }

acceptance:
  sample: { quantity: { value: 250, unit: episode }, paid: true }
  criteria:
    - metric: sync_error_ms
      operator: lte
      value: 10
      measurement: p99 pairwise stream skew per episode, buyer ingest, all episodes.

licensing: { commercial_training: true, exclusive: false }
delivery: { deadline: "2026-11-18", format: { standard: lerobot } }
```

One file. Machine-validatable, human-renderable, comparable across buyers,
publishable in a repo or on a platform.

## Quick start

```bash
npm install          # from a clone; package: @odrs/core
npx odrs init        # writes a starter data-request.yaml with a minted id
npx odrs validate data-request.yaml
npx odrs render   data-request.yaml
```

`validate` distinguishes **errors** (the document is not valid ODRS) from
**warnings** (valid, but omits something that historically causes disputes —
no acceptance criteria, no action space on robot manipulation, an episode
count with no duration bounds).

As a library:

```js
import { validateRequest, renderRequest } from "@odrs/core";
const { valid, errors, warnings } = validateRequest(doc);
```

## What's in the box

| Path | What |
|---|---|
| [`spec/v0.1/data-request.schema.json`](spec/v0.1/data-request.schema.json) | The normative JSON Schema |
| [`spec/v0.1/specification.md`](spec/v0.1/specification.md) | Field-by-field semantics, vocabularies, well-known metrics |
| [`spec/v0.1/examples/`](spec/v0.1/examples/) | 10 worked examples (CC0) — humanoid warehouse, egocentric kitchen, tactile grasping, pooled-consortium buying, … |
| [`bin/odrs.mjs`](bin/odrs.mjs) | CLI: `validate` · `render` · `inspect` · `init` · `version` |
| [`src/`](src/) | `@odrs/core` — validator, linter, renderer |
| [`docs/`](docs/) | Design principles, extensions, adoption, relationship to existing standards |
| [`GOVERNANCE.md`](GOVERNANCE.md) | Stewardship, change process, versioning rules, scope commitments |

## Design in one paragraph

Four required fields (`odrs_version`, `type`, `task`, `data`); everything
else optional, with a linter that warns about expensive omissions.
`embodiment` is optional because human demonstration data has no robot.
Acceptance criteria must state **how they are measured**, not just a number —
`task_success_rate >= 0.9` is unenforceable until someone says who judges
success, against what definition, over what sample. Budgets, when disclosed,
must state their **basis** (total vs per-unit) or they are not comparable.
Vocabulary is small and closed; everything domain-specific lives in
namespaced `extensions`. Unknown fields are preserved, never rejected.

## Relationship to existing standards

ODRS describes **requests**; LeRobot/RLDS/MCAP describe **deliveries**; ISO/WD
26264 describes dataset requirements; Croissant describes dataset metadata.
An ODRS request names its target delivery format via `delivery.format` —
complementary, not competing. Details:
[docs/relationship-to-existing-standards.md](docs/relationship-to-existing-standards.md).

## Roadmap

| Version | Object | Question it answers |
|---|---|---|
| **0.1 (this)** | `data_request` | What data do I need? |
| 0.2 | `capability` | What data can I provide? |
| 0.3 | `offer` | What can I provide *for this request*? |
| 0.4 | `dataset` | What was actually delivered? |
| 0.5 | `attestation` | Is it what was promised, and where did it come from? |
| 1.0 | exchange | The full request → offer → delivery → verification loop |

Future versions are named so the ID prefixes and `type` values can be
reserved now; they are otherwise deliberately unspecified.

## Governance, licensing, contributing

Stewarded by the DumbRobot project with a **written transfer commitment** to a
neutral standards body (MLCommons Data WG primary target) at three independent
implementations or twelve months, whichever comes first — see
[GOVERNANCE.md](GOVERNANCE.md). No CLA; contributions under DCO
(`git commit -s`). Schema changes go through a lightweight enhancement
proposal ([proposals/TEMPLATE.md](proposals/TEMPLATE.md)).

| Component | License |
|---|---|
| Code (schema, validator, CLI) | Apache-2.0 ([LICENSE](LICENSE)) |
| Specification prose | CC BY 4.0 |
| Examples | CC0 1.0 |

## Status, honestly

ODRS v0.1 is a proposal with a reference implementation and a test suite. It
has not been adopted by anyone. The fastest way to falsify or improve it:
take a real data requirement you have, try to encode it, and open an issue
where the encoding was ambiguous or impossible.

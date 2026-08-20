# Getting started with ODRS

Ten minutes from zero to a validated, publishable data request.

## 1. Install

```bash
git clone https://github.com/Yoo-yipeee/odrs
cd odrs && npm install
```

(Once published to npm: `npm i -g @odrs/core`.)

## 2. Scaffold a request

```bash
node bin/odrs.mjs init my-request.yaml
```

You get a commented starter with a freshly minted `dr_` id and TODOs at every
decision point.

## 3. Fill it in — the decisions that matter

Work top to bottom. The fields that repay the most care:

- **`data.quantity`** — pick the unit deliberately. `episode` = one attempt,
  any outcome; `demonstration` = a *successful* episode. Add
  `episode_duration_seconds.typical`: an episode count without duration
  bounds is unpriceable.
- **`environment.realism`** — `in_the_wild` vs `staged_real` vs `lab_mockup`
  drives much of the price. Left implicit, it becomes a rejected delivery.
- **`capture.action_space`** (robot data) — the recorded control
  representation. Omitting it is the most common cause of an unusable
  delivery.
- **`diversity`** — floors on distinct environments/objects/operators.
  100K episodes from one room are worth less than 10K across 500.
- **`acceptance`** — start with a sample gate, then criteria. Every
  threshold must say **how it is measured and who judges it**; the schema
  will not let you skip `measurement`.
- **`economics.budget.basis`** — total or per-unit. Enforced.

## 4. Validate

```bash
node bin/odrs.mjs validate my-request.yaml
```

Two kinds of output:

- **✗ errors** — the document is not valid ODRS. Fix them.
- **⚠ warnings** — valid, but you omitted something that historically causes
  disputes ("no acceptance criteria", "no action space on robot
  manipulation"). Publishing anyway is allowed; the warnings are a free
  procurement review.

`--strict` exits non-zero on warnings too (useful in CI).

## 5. Read it back as a human

```bash
node bin/odrs.mjs render my-request.yaml
```

If the rendered summary doesn't say what you meant, the document doesn't say
what you meant.

## 6. Publish

Anywhere. The document is the artifact:

- commit `data-request.yaml` to your repo,
- post it on a platform that speaks ODRS,
- or email the YAML to a supplier.

Mint the id at publication time for anonymous requests (ULIDs embed a
timestamp — `objectId`/`requestId` accept a coarsened one).

## 7. The rest of the exchange (v0.2)

Suppliers answer with `offer` documents (deviations stated up front),
deliveries ship with `dataset` manifests (checksum-bound, actuals included),
and acceptance is recorded as an `attestation` (verdicts with measurement
methods). Walk through [`spec/v0.2/examples/exchange/`](../spec/v0.2/examples/exchange/)
— four linked files telling one complete story — then read the
[v0.2 specification](../spec/v0.2/specification.md).

## Using the library

```js
import { validateDocument, renderDocument, objectId } from "@odrs/core";

const { valid, errors, warnings, objectType } = validateDocument(doc);
```

Validation dispatches on `type` + `odrs_version` automatically. Documents are
`unknown` on purpose — validate, don't cast.

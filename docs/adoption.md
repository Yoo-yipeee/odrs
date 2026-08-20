# Why adopt ODRS

The specification is free and requires no platform. The practical incentives,
per participant:

## Buyers (robotics and Physical AI companies)

- **Write the requirement once, precisely.** The schema forces the decisions
  that otherwise surface as delivery disputes: action space, viewpoints,
  realism, diversity floors, who judges success on what sample. The
  validator's warnings are a free procurement review.
- **Compare supplier responses like-for-like.** Structured budgets
  (`basis: per_unit`), structured acceptance criteria, and defined units mean
  quotes against the same request are actually comparable.
- **Reuse.** The next request is an edit, not a fresh Notion page. A
  `data-request.yaml` can be versioned, diffed, and reviewed like code.

The single-player value is deliberate: a buyer gains from ODRS with zero
other adopters, because the discipline of the format catches specification
errors before money moves. Networks come later; correctness pays now.

## Suppliers (collection companies, teleop operators, labs, factories)

- **Machine-readable demand.** A request states quantity, geography,
  embodiment, rights and acceptance in fixed places — scoping and bid/no-bid
  in minutes, not meetings.
- **Partial response is expressible.** `data.quantity.minimum` invites a
  supplier with 20k capacity to answer a 100k request instead of declining.
- **One capability description, many requests** — once `capability` objects
  land in v0.2.

## Marketplaces and platforms

- A common import/export format instead of N proprietary intake forms;
  requests can move between platforms without retyping, and a platform that
  consumes ODRS gets every ODRS-authoring buyer as a potential lister.
- The publication envelope (`visibility`, `status`, `contact:
  via_platform`) was designed so platforms can layer identity, escrow and
  matching *around* the document without forking it.

## Researchers and analysts

- Aggregatable demand: structured, unit-defined, basis-stated requests are
  the raw material of demand indices and price benchmarks that currently do
  not exist for Physical AI data.

## AI agents

- A procurement agent can draft, validate, compare and respond to
  requirements with schema guarantees instead of prompt-parsing PDFs. The
  format is small enough to sit in a context window, and the validator gives
  the agent a ground truth for "did I express that correctly?"

## The honest limits

ODRS does not make anyone respond to a request, verify anyone's claims, or
move money. It removes ambiguity, not counterparty risk. Those layers —
offers, attestation, escrow — are either future versions (see roadmap) or
deliberately out of scope forever (GOVERNANCE.md §9).

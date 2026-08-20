# EP-<n>: <title>

- **Status:** draft | review | accepted | rejected | deferred
- **Author(s):** <name / handle>
- **Created:** <YYYY-MM-DD>
- **Affects:** schema | vocabulary | field semantics | governance

## Motivation

What real requirement cannot be expressed today, or is expressed ambiguously?
Concrete evidence beats argument: an actual request (anonymized), a
divergence found by the two-encoder test, a dispute this would have
prevented.

## Specification

The exact change: schema diff or new field definitions with name, type,
required/optional, meaning, allowed values, example. For vocabulary
additions: the term, its written definition, and why no existing term plus an
extension covers it.

## Backward compatibility

Which of GOVERNANCE.md §5's categories this falls into (new optional field /
new vocabulary value / breaking), and the migration story if breaking.
Remember the standing rules: field names are never reused with different
meanings, and consumers must keep tolerating unknown fields.

## Alternatives considered

Including "do nothing" and "do it as an extension". If an extension suffices,
the EP should usually be rejected — say why it doesn't.

## Reference implementation

Link to a branch/PR updating the schema, validator, at least one example, and
the tests. May be pending at draft stage; required before acceptance.

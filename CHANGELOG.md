# Changelog

All notable changes to the ODRS specification and the `@odrs/core` reference
implementation. Follows the versioning rules in GOVERNANCE.md §5; before
v1.0, minor versions MAY break and every break is listed here with a
migration note.

## [0.1.0] — 2026-08-20

Initial release of the specification and reference implementation.

### Specification
- `data_request` object with four required fields (`odrs_version`, `type`,
  `task`, `data`) and optional sections: `embodiment`, `environment`,
  `modalities`, `capture` (action space, sensors, synchronization),
  `diversity`, `geography` (collection/usage split), `acceptance`
  (sample gate + measured criteria), `metadata`, `licensing` (incl.
  provenance and consent flags), `delivery` (incl. target dataset format),
  `economics` (budget with mandatory basis), `publication`, `extensions`.
- Controlled vocabularies with written definitions; `trajectory` deliberately
  excluded as a unit (ambiguous) in favour of defined `episode` /
  `demonstration`; `teleoperation` classified as a capture method, not a
  modality.
- Eight well-known acceptance metrics with fixed meanings; free-form metrics
  permitted when fully defined in `measurement`.
- ID scheme `dr_` + ULID; prefixes `cap_`, `off_`, `dat_`, `att_` reserved.
- Conformance classes (producer / consumer / validator); consumers must
  preserve unknown fields.

### Reference implementation
- `@odrs/core`: schema validation (ajv, strict), SHOULD-level linter,
  human-readable renderer, structural inspector, ULID generation.
- CLI: `odrs validate | render | inspect | init | version`.
- 10 CC0 examples; 13 invalid fixtures each asserted to fail for its
  documented reason; 45 tests.

### Known limitations
- `odrs.org` schema `$id` namespace is provisional (domain not registered).
- Extension registry contains only illustrative entries.
- The two-encoder ambiguity test has not yet been run with external users.

# Changelog

All notable changes to the ODRS specification and the `@odrs/core` reference
implementation. Follows the versioning rules in GOVERNANCE.md §5; before
v1.0, minor versions MAY break and every break is listed here with a
migration note.

## [0.2.0] — 2026-08-20

The object family. v0.1 standardized the ask; v0.2 makes the whole exchange
machine-readable.

### Specification
- Four new objects: `capability` (cap_) "what can I provide?", `offer` (off_)
  "what can I provide for this request?" with first-class deviations,
  `dataset` (dat_) delivery manifests with checksum binding, provenance
  chains and measured actuals, and `attestation` (att_) verdicts with
  mandatory measurement methods.
- Validators dispatch on `odrs_version` + `type`; published versions are
  immutable and v0.1 requests validate forever.
- The v0.2 request object is unchanged except one tightening:
  `acceptance.sample.quantity.unit` is constrained to the defined unit
  vocabulary (free-form in v0.1; typos validated silently). Migration: map
  nonstandard sample units to the closest defined unit, or stay on 0.1.
- Roadmap note: the original plan shipped one object per release
  (v0.2..v0.5); they ship together here at the steward's direction because
  they only make sense as a family. v1.0 stays reserved for post-adoption
  hardening.

### Reference implementation
- `validateDocument()` (all types), `objectId()`, per-type linters
  (unevidenced capability claims, undeclared offer deviations, checksum-less
  datasets, threshold-less attestation verdicts), per-type renderers,
  CLI validates/renders every object type.
- New examples: two capabilities and a complete linked exchange set
  (request → offer → dataset → attestation) whose cross-references are
  test-enforced, including deviation paths resolving against the request.
- 75 tests (was 45). GitHub Actions CI (ubuntu/windows × node 20/22).

### Documentation
- spec/v0.2/specification.md (object family + exchange loop), new
  docs/concepts.md, docs/getting-started.md, docs/versioning.md.
- v0.1 specification errata: documented four previously-unlisted enum
  vocabularies (reference_frame, synchronization.method, sample.evaluation,
  delivery.transfer) and the nested fields the field tables skipped.

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

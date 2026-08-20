# ODRS Governance

**Status:** Initial stewardship. ODRS is an early-stage open specification, not an
industry standard. It has no formal adopters yet, and nothing in this document
should be read as claiming otherwise.

## 1. Stewardship

ODRS is currently stewarded by the DumbRobot project. This is stated plainly
rather than dressed up as community governance, because it is the truth and
because a specification that misrepresents its own governance cannot ask to be
trusted about anything else.

Stewardship means: the maintainers merge changes, cut versions, and make final
calls on proposals. It does not mean ownership of the specification, which is
published under an open license and may be implemented by anyone without
permission, notice, or fee.

### 1.1 Transfer commitment

The stewards commit to proposing transfer of ODRS to a vendor-neutral standards
body when **either** of the following occurs:

- **three independent implementations** exist, authored by organizations with no
  ownership or employment relationship to the current stewards; or
- **twelve months** have elapsed since the v0.1 tag.

Primary target: the **MLCommons Data working group**, which maintains Croissant
and does closely adjacent vocabulary work.
Secondary target: the **Open Source Robotics Alliance (OSRA)**.

If neither accepts, the stewards will publish the refusal and propose an
alternative within 90 days. Transfer will not be quietly dropped.

## 2. No vendor dependency

ODRS MUST remain implementable without any DumbRobot product, account, API, or
service. Any proposal that introduces such a dependency will be rejected on that
ground alone, regardless of technical merit.

DumbRobot may be *a* reference implementation. It may never be *the required*
implementation.

## 3. Contributions

- Contributions are accepted under the **Developer Certificate of Origin (DCO)**.
  Sign commits with `git commit -s`.
- There is **no Contributor License Agreement**. A CLA assigning rights to a
  company would contradict Section 2, and no technical convenience justifies it.

## 4. Change process

Two paths, deliberately lightweight.

**Issues** — questions, ambiguities, bugs, documentation gaps. No template
required. Most changes should start and end here.

**Enhancement proposals (ODRS-EP)** — required for anything that changes the
schema, the controlled vocabularies, or the documented meaning of a field.

1. Open a PR adding `proposals/EP-<n>-<slug>.md` using `proposals/TEMPLATE.md`.
   Required sections: Motivation, Specification, Backward compatibility,
   Alternatives considered, Reference implementation (may be pending).
2. A **14-day** comment period begins when the PR is labelled `ep:review`.
3. Maintainers accept, reject, or defer, and record the reasoning in the PR.
   A rejection without written reasoning is invalid.

There is no steering committee, no voting, and no membership tier. These will be
added if and when the contributor base makes them necessary, and not before.

## 5. Versioning

ODRS follows semantic versioning, with pre-1.0 rules stated explicitly because
pre-1.0 semver is widely misunderstood.

**Before v1.0**, minor versions MAY introduce breaking changes. Every breaking
change MUST be listed in `CHANGELOG.md` with a migration note. Do not build
production systems against v0.x without pinning.

**From v1.0 onward:**

| Change | Version bump |
|---|---|
| New optional field | minor |
| New value in a controlled vocabulary | minor |
| New required field | **major** |
| Removing or renaming a field | **major** |
| Changing the documented meaning of an existing field | **major** |

Two rules that hold at every version:

- **A field name is never reused with a different meaning.** Deprecate and
  introduce a new name instead. Silent semantic drift is the failure mode that
  destroys interoperability, and it is unrecoverable once deployed.
- **Deprecated fields** are marked in the schema, warned on by the validator, and
  removed no earlier than the next major version.

## 6. Conformance

ODRS uses RFC 2119 keywords (MUST, SHOULD, MAY) with their normative meanings.

Three conformance classes:

- **Producer** — emits documents that validate against the published schema.
- **Consumer** — reads ODRS documents. A conforming consumer **MUST preserve
  fields it does not recognize** when storing or re-emitting a document, and MUST
  NOT reject a document solely for containing them. This is what makes forward
  compatibility real rather than aspirational.
- **Validator** — implements the published validation rules and reports the
  documented error codes.

An implementation MAY claim "implements ODRS v0.1" for a class it satisfies.

## 7. Licensing

| Component | License |
|---|---|
| Specification prose (`spec/**/*.md`, `docs/`) | CC BY 4.0 |
| Schemas, validator, CLI, SDK | Apache-2.0 |
| Examples (`spec/**/examples/`) | CC0 1.0 |

Examples are CC0 deliberately: copying an example into your own repository should
carry no attribution obligation. Apache-2.0 on code includes an express patent
grant, which matters for anything intended as a standard.

## 8. Trademark

If the ODRS name is registered, the stewards commit to a policy permitting
unrestricted factual use — "implements ODRS", "ODRS-compatible", "based on ODRS" —
without license or fee. The name will not be used to restrict conforming
implementations.

## 9. Scope discipline

ODRS describes **data requirements**. It is not, and will not become within the
v0.x line:

a payment protocol · an escrow or settlement system · a legal contract format ·
an identity or authentication system · a dataset storage format · a universal
robotics ontology · a single-number quality score · a matching or ranking
algorithm

Proposals in these areas will be closed with a pointer to this section. Adjacent
problems are real; solving them here would make the core unimplementable.

## 10. Disclaimer

ODRS structures the expression of licensing *requirements*. It does not create a
legal agreement, does not constitute legal advice, and does not substitute for a
contract between parties.

# ODRS design principles

Twelve principles, each with the reason it exists. When a proposal conflicts
with one of these, the proposal loses unless it changes the principle first —
openly, by enhancement proposal.

1. **Open by default.** The specification is publicly readable, implementable
   without permission, and free of charge. *Why:* a demand-expression format
   only creates value if both sides of an asymmetric market can use it; any
   gate reintroduces the fragmentation it exists to remove.

2. **Platform independent.** No field, workflow, or identifier requires any
   particular platform, including the steward's. *Why:* the moment the format
   needs one vendor, it is that vendor's API schema, not a specification —
   and every other vendor is rational to reject it.

3. **Machine readable.** Canonical JSON, validated by JSON Schema, stable
   controlled vocabularies. *Why:* the payoff of structure is comparability
   and automation — matching, aggregation, price indexing. Prose can't be
   diffed or queried.

4. **Human understandable.** YAML authoring, a reference renderer, prose
   `summary`/`description` fields alongside every structured section. *Why:*
   requests are read by procurement people, lawyers and lab managers, not
   only by parsers; a format humans can't review is a format humans won't
   trust.

5. **Minimal core.** Four required fields. *Why:* every additional required
   field is a reason not to adopt, and the format must be usable by a
   half-formed draft in a private repo as well as a funded public tender. The
   linter — not the schema — is where "you really should state this" lives.

6. **Extensible without permission.** Namespaced `extensions`, external
   `taxonomy` references, unknown fields preserved. *Why:* the domain moves
   faster than any standards process; if specialization can't happen outside
   the core, it happens as forks of the core.

7. **Domain neutral.** The core carries no assumptions specific to humanoids,
   manipulation, or any single embodiment — including the assumption that
   there is a robot at all (`embodiment` is optional; `human` is a value).
   *Why:* the first version of this spec that privileged one segment's
   worldview encoded that bias forever; human demonstration data proved the
   test case.

8. **Explicit semantics.** Every vocabulary term has a written definition;
   near-synonyms are collapsed (`trajectory` was removed in favour of a
   defined `episode`); acceptance criteria must state their measurement
   method. *Why:* interoperability dies of ambiguity, not of syntax errors.
   The most expensive disputes in this market are two parties who both
   complied with the same undefined word.

9. **Privacy aware.** Country-level geography only; no identity
   infrastructure in the document; anonymous visibility as a first-class
   value; pseudonymous per-episode identifiers; the ULID-timestamp caveat
   documented. *Why:* a data requirement reveals a buyer's roadmap, and
   collection involves real people in real homes and workplaces. A format
   that leaks either will be avoided by exactly the participants who matter
   most.

10. **Backward compatibility as a contract.** Field names are never reused
    with different meanings; deprecations warn before removals; consumers
    must tolerate unknown fields. *Why:* documents outlive software.
    A request published in 2026 must still parse correctly in 2030.

11. **No vendor lock-in.** DCO not CLA; Apache-2.0 with patent grant; a
    written stewardship-transfer commitment with triggers. *Why:* neutrality
    claimed is cheap; neutrality bound is credible. See GOVERNANCE.md.

12. **No financial dependency.** The spec defines no payment rails, tokens,
    or fees, and `economics` is entirely optional. *Why:* money mechanics
    belong to the platforms and contracts built on top; putting them in the
    core would couple the format's survival to a business model.

# ODRS extensions

The core schema is deliberately small. Anything domain-specific — tactile
sensor families, humanoid hand kinematics, a marketplace's internal
procurement fields — lives in `extensions`, keyed by namespace.

## Shape

```yaml
extensions:
  tactile:                       # short namespace: community/domain extension
    sensor_family: optical_gel
    minimum_taxel_grid: [16, 16]
    shear_sensing_required: true

  com.example.procurement:       # reverse-DNS: organization-private extension
    reference: EHC-2026-DS-114
```

Rules (normative, enforced by schema where possible):

- A namespace is a lowercase identifier (`[a-z][a-z0-9_]*`) or a reverse-DNS
  name (`com.example.something`). Each namespace's value is an object.
- **Short namespaces** are community property: claim one by documenting it
  (see below). **Reverse-DNS namespaces** are yours by construction; no
  registration, no collision.
- Consumers MUST ignore namespaces they do not recognize and MUST preserve
  them when storing or re-emitting a document.
- An extension MUST NOT change the meaning of any core field. If your
  extension needs to override `data.quantity`, what you actually need is an
  enhancement proposal against the core.
- Producers SHOULD treat extensions as *additive detail*: a consumer that
  reads only the core document must still get a correct (if less precise)
  picture of the requirement.

## Publishing an extension

1. Write a short spec: namespace, each field's name / type / meaning /
   example — same discipline the core applies to itself.
2. Put it somewhere stable (a repo of its own is fine).
3. Open a PR adding one line to the registry below.

## Extension registry

| Namespace | Fields (summary) | Spec | Status |
|---|---|---|---|
| `tactile` | sensor family, taxel grid, shear sensing, calibration | (this repo, examples only) | illustrative |
| `humanoid` | hand type, fingers, payload | (this repo, examples only) | illustrative |

The two entries above exist only to make the examples concrete; treat them as
sketches, not published extensions. The first real registry entry should come
from someone who needs it.

## When something should move from extension to core

An extension field is a core candidate when (a) two or more independent
parties use it with the same meaning, and (b) it is embodiment- and
domain-neutral. That's an enhancement proposal with evidence attached — the
extension mechanism doubles as the core's staging area.

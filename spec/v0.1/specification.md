# ODRS v0.1 — Open Data Request Specification

**Status:** proposed open specification. ODRS is early-stage. It is not an
industry standard and claims no adoption it does not have.

ODRS defines a machine-readable format for expressing **Physical AI data
requirements**: what data an organization needs collected, captured how,
meeting what acceptance criteria, under what rights. It standardizes the
**ask**. Delivered datasets are described by existing formats (LeRobot, RLDS,
HDF5, MCAP); ODRS points at them via `delivery.format` and does not compete
with them. See [Relationship to existing standards](../../docs/relationship-to-existing-standards.md).

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are to be
interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

The normative artifact is [`data-request.schema.json`](./data-request.schema.json)
(JSON Schema draft 2020-12). Where this prose and the schema disagree, the
schema wins and the disagreement is a bug — report it.

---

## 1. Document model

An ODRS document is a single JSON object. **JSON is the canonical machine
representation.** YAML 1.2 is an accepted authoring format; any valid ODRS
YAML document MUST convert losslessly to canonical JSON.

Suggested media type: `application/vnd.odrs.request+json` (not yet registered).
Suggested filename for repository publication: `data-request.yaml`.

### 1.1 Conformance classes

- **Producer** — emits documents that validate against the published schema.
- **Consumer** — reads ODRS documents. A conforming consumer MUST preserve
  fields it does not recognize when storing or re-emitting a document, and
  MUST NOT reject a document solely because it contains unknown fields. This
  rule is what makes forward compatibility real.
- **Validator** — implements the schema plus the SHOULD-level advisory checks
  and distinguishes errors (invalid) from warnings (valid but risky).

### 1.2 Required fields

Exactly four: `odrs_version`, `type`, `task`, `data`. Everything else is
optional. The floor is deliberately low — a draft in a private repo should
not be forced to state a budget — but validators SHOULD warn on omissions
listed in §6.

Note what is *not* required: `embodiment`. Human demonstration and egocentric
capture — among the largest data categories in Physical AI — have no robot in
them. A specification that cannot express them would be wrong on day one.

---

## 2. Field reference

Dotted paths. R = required, O = optional.

### 2.1 Envelope

| Field | R/O | Meaning |
|---|---|---|
| `odrs_version` | R | Spec version, `"0.1"` or `"0.1.x"`. Pre-1.0 minors may break; pin it. |
| `type` | R | Always `"data_request"` in v0.1. Discriminator for future object types (`capability`, `offer`, `dataset`, `attestation`). |
| `id` | O→R | `dr_` + 26-char Crockford-base32 ULID. Optional while drafting; REQUIRED once published to any registry. See §3. |
| `title` | O | Human label, ≤200 chars. Not machine-interpreted. |
| `summary` | O | Prose. Complements structured fields, never replaces them. |

### 2.2 `task` (required)

| Field | R/O | Meaning |
|---|---|---|
| `task.category` | R | One of the vocabulary in §4.1. Use `other` + `taxonomy` rather than stretching a category. |
| `task.type` | O | Finer-grained task, free text. Deliberately not enumerated: the task space is open-ended and a closed list would be stale within months. |
| `task.description` | O | Prose. |
| `task.includes_failures` | O | Default `false`. Set `true` when unsuccessful attempts are wanted — common, since recovery behaviour is often the training target. This flag is one reason ODRS has no global success-rate field: "90% success" and "at least 10% genuine failures" can both be real requirements, sometimes in the same request (see the flagship example). |
| `task.taxonomy` | O | External vocabulary reference: `{namespace, value, version}`. |

### 2.3 `embodiment` (optional)

| Field | Meaning |
|---|---|
| `type` | §4.2 vocabulary. `human` = a person performs the task and is instrumented. `none` = nothing is instrumented; the data is observational. |
| `alternatives` | Other acceptable types, descending preference. Widens the supplier pool. |
| `platform` | Specific hardware (`"Franka Research 3"`). Narrows the supplier pool sharply; state only if genuinely required. |
| `hands`, `degrees_of_freedom` | Integers. |

### 2.4 `environment` (optional, SHOULD)

`type` (§4.3) plus **`realism`**: `in_the_wild` / `staged_real` / `lab_mockup`
/ `simulation`. Realism drives much of the price difference between otherwise
identical requests and is the most common implicit assumption behind rejected
deliveries. State it.

### 2.5 `data` (required)

`data.quantity.value` (> 0) and `data.quantity.unit` (§4.4) are required.
`data.quantity.minimum` lets a supplier respond partially instead of
declining. `data.episode_duration_seconds` {min, typical, max} SHOULD be
present for episode-counted requests: an episode count without duration
bounds spans two orders of magnitude of collection effort and is unpriceable.

### 2.6 `modalities` (optional, SHOULD)

Array from §4.5 — the lightweight form. For per-sensor detail use
`capture.sensors`. Where both appear they MUST be consistent;
`capture.sensors` is authoritative.

### 2.7 `capture` (optional, SHOULD for robot data)

- `method` — §4.6. Teleoperation is a *method*, not a modality.
- `action_space` — `{representation (§4.7), reference_frame, control_frequency_hz}`.
  **The single most important optional block in the specification.** Two
  requests identical everywhere else yield mutually incompatible datasets if
  one expects joint positions at 50Hz and the other delta end-effector poses
  at 10Hz. Omitting it is the most common cause of an unusable delivery.
- `sensors[]` — per-sensor: `modality`, `viewpoint` (§4.8 — the
  highest-variance factor in manipulation data and the most frequently
  omitted), `count`, `resolution`, `frequency_hz`, `calibration_required`.
- `synchronization` — `maximum_error_ms` and `method`. A sync bound stated
  here is a *requirement*; it is verified via `acceptance.criteria`.

### 2.8 `diversity` (optional, SHOULD for large orders)

Minimum distinct counts for environments, scenes, objects, operators,
embodiment instances, lighting conditions — each `{minimum, target}` — plus
`maximum_share_per_environment` (0–1], which prevents a nominally diverse
delivery that is 80% one room. For most training objectives diversity
constrains usefulness more tightly than raw quantity: 100,000 episodes from
one scene are worth less than 10,000 across 500 homes.

### 2.9 `geography` (optional)

ISO 3166-1 alpha-2, arrays: `collection`, `collection_excluded`, `usage`.
Collection and usage are separated deliberately — they carry different legal
consequences (worker/participant consent regimes attach to collection;
transfer and training regimes attach to usage). Country granularity only:
finer location in a published request is a privacy risk.

### 2.10 `acceptance` (optional, SHOULD)

The operative section. A threshold with no measurement method is a wish.

- `sample` — `{quantity, delivery_days, paid, evaluation, notes}`. Procurement
  in this market is sample-gated: small first batch, evaluated, then the full
  order. Most requests should start here.
- `criteria[]` — each criterion: `metric`, `operator`
  (`lte|lt|gte|gt|eq|neq|in`), `value`, optional `unit`, **required
  `measurement`**, optional `sample_size`, optional `blocking` (default true).

`measurement` is required by schema, and it is the heart of the design: it
must state **who or what evaluates the metric, against what definition, over
what population**. `task_success_rate >= 0.9` is meaningless until it says
whether success is judged by the teleoperator, a human reviewer, or a trained
policy, and against which task definition. The number was never the hard part.

### 2.11 Well-known metrics

Producers MAY use any `metric` name; unknown names MUST be fully defined in
`measurement`. The following names are reserved with fixed meanings:

| Metric | Definition |
|---|---|
| `sync_error_ms` | Timestamp skew between two modality streams within one episode: for each pair of streams, the absolute difference between corresponding sample timestamps. `measurement` MUST state the statistic (e.g. p99 vs max) and the population (which pairs, which episodes). |
| `task_success_rate` | Fraction of episodes judged successful. ODRS does not define success; the request MUST, inside `measurement` (judge, definition, adjudication). May be used with `lte` as a *ceiling* to mandate genuine failures. |
| `frame_drop_rate` | 1 − (received / expected) frames per stream per episode, expected = nominal `frequency_hz` × episode duration. |
| `annotation_agreement` | Inter-annotator agreement on required labels. `measurement` MUST name the statistic (percent agreement, Cohen's κ, etc.) and the double-labelled fraction. |
| `calibration_reprojection_error_px` | RMS reprojection error of calibration-target points under the shipped intrinsics/extrinsics. `measurement` states target type and recording cadence. |
| `missing_metadata_rate` | Fraction of episodes lacking any field listed in `metadata.required`. |
| `duplicate_rate` | Fraction of episodes that duplicate or near-duplicate another episode in the same delivery. `measurement` MUST state the detection method and tolerance. |
| `corrupt_episode_rate` | Fraction of episodes unreadable or failing structural checks in the agreed `delivery.format`. |

### 2.12 `metadata`, `licensing`, `delivery`, `economics`

- `metadata` — `required[]` / `preferred[]` per-episode fields.
- `licensing` — boolean rights flags (`research`, `commercial_training`,
  `commercial_deployment`, `derivative_models`, `redistribution`,
  `exclusive`) plus `exclusivity_months`, `term_months` (omit = perpetual),
  `attribution_required`, and two provenance flags:
  `provenance_documentation_required` and `consent_artifacts_required`.
  Buyers under EU AI Act high-risk obligations generally need both, and
  asking after delivery is too late. **ODRS structures licensing
  *requirements*. It does not grant rights, form a contract, or constitute
  legal advice.**
- `delivery` — `deadline` (ISO 8601 date), `milestones[]`, `format`
  (`{standard: lerobot|rlds|hdf5|mcap|rosbag2|webdataset|parquet|custom|unspecified, version}`),
  `transfer`.
- `economics` — everything optional; a spec that forces budget disclosure
  will simply be ignored. `pricing_model`:
  `fixed_budget|price_discovery|market_rate|undisclosed`. `budget`:
  `{min, max, currency (ISO 4217), basis, unit}`. **`basis` (`total` |
  `per_unit`) is required whenever a figure is present** — enforced by
  schema — because a range with no basis is not comparable across requests,
  and comparability is the point.

### 2.13 `publication` (optional)

Listing state, kept apart from request semantics: the same requirement
published in two registries has one meaning and two publication states.
`visibility` (`public` / `anonymous` / `private`), `status` (§4.9),
`published_at`, `expires_at`, `publisher` (`{type, name, id, url}` —
`type: consortium` marks pooled demand), and `contact` (`{method, value}`).
A request published with no contact is a broadcast into a void; validators
warn. ODRS carries **no identity infrastructure**: for anonymous requests the
platform stores identity separately, and the document simply omits it.

### 2.14 `extensions` (optional)

Namespaced objects: `{"<namespace>": {…}}`. Namespaces are lowercase
identifiers (`tactile`, `humanoid`) or reverse-DNS for third parties
(`com.example.procurement`) — enforced by schema. Consumers MUST ignore
unrecognized namespaces and MUST preserve them on re-emission. Anyone may
publish an extension; publishing means documenting the namespace and its
fields where implementers can find them. The core stays small; specialization
lives here.

---

## 3. Identifiers

`dr_` + ULID (26 chars, Crockford base32, uppercase, no I/L/O/U).
Reserved prefixes for future objects: `cap_`, `off_`, `dat_`, `att_`.

IDs are optional at authoring time (a draft in a repo needs no registry) and
required at publication. `odrs init` mints one.

**Privacy note:** a ULID's first 10 characters encode its creation timestamp.
On anonymous requests this leaks drafting time. Mitigation: mint the ID at
publication rather than drafting, or pass a coarsened timestamp (midnight UTC
of the publication day) to the generator.

---

## 4. Controlled vocabularies

The schema is the canonical list; this section carries the meanings. There is
deliberately **no separate `vocabulary.json`** — two machine-readable sources
of the same enum drift apart, and drift in a vocabulary is fatal to its
purpose. Vocabularies grow by enhancement proposal (see GOVERNANCE.md); each
addition is a minor version.

- **4.1 task.category** — `manipulation`, `navigation`, `locomotion`,
  `assembly`, `inspection`, `grasping`, `human_demonstration`, `household`,
  `warehouse`, `industrial`, `agriculture`, `healthcare`, `driving`,
  `social_interaction`, `other`. (Mixed abstraction — some are skills, some
  are domains — acknowledged and accepted for v0.1: it matches how buyers
  actually talk. A cleaner two-axis split is a candidate for v0.2.)
- **4.2 embodiment.type** — `humanoid`, `robotic_arm`, `bimanual_arm`,
  `mobile_robot`, `mobile_manipulator`, `quadruped`, `drone`,
  `autonomous_vehicle`, `exoskeleton`, `human`, `none`, `other`.
- **4.3 environment.type** — `home`, `kitchen`, `office`, `warehouse`,
  `factory`, `laboratory`, `hospital`, `farm`, `road`, `retail`,
  `construction`, `outdoor`, `other`; **realism**: `in_the_wild`,
  `staged_real`, `lab_mockup`, `simulation`.
- **4.4 data.quantity.unit** — with definitions, because near-synonyms
  destroy comparability:
  - `episode` — one continuous recorded attempt, from environment reset to
    termination, **regardless of outcome**.
  - `demonstration` — an episode judged successful and intended as an
    imitation target. Every demonstration is an episode; not conversely.
  - `hour` — wall-clock duration of **usable data after QA**, excluding setup
    and rejected takes.
  - `frame` — a single synchronized multi-sensor sample.
  - `scene` — a distinct physical setup or configuration.
  - `interaction` — one contact-bearing exchange with an object or person.
  - `sample` — escape hatch; MUST be defined in `data.quantity_note`.
  - `trajectory` is **deliberately absent** — ambiguous between container and
    signal. Encode as `episode`.
- **4.5 modalities** — `rgb`, `depth`, `rgbd`, `lidar`, `thermal`,
  `event_camera`, `audio`, `tactile`, `force_torque`, `imu`, `joint_state`,
  `action`, `pose`, `hand_pose`, `body_pose`, `eye_gaze`,
  `language_annotation`, `text`. (`teleoperation` is absent — it is a
  capture method.)
- **4.6 capture.method** — `teleoperation`, `kinesthetic_teaching`,
  `scripted_policy`, `autonomous_policy`, `human_wearable`,
  `fixed_camera_observation`, `motion_capture`, `simulation`, `mixed`, `other`.
- **4.7 action_space.representation** — `joint_position`, `joint_velocity`,
  `joint_torque`, `ee_pose_absolute`, `ee_pose_delta`, `ee_twist`,
  `base_velocity`, `gripper_continuous`, `gripper_binary`, `none`.
- **4.8 sensor viewpoint** — `wrist`, `head`, `chest`, `egocentric`,
  `third_person`, `overhead`, `scene_fixed`, `in_hand`, `other`.
- **4.9 publication.status** — `draft`, `open`, `partially_fulfilled`,
  `fulfilled`, `closed`, `cancelled`.

---

## 5. Versioning

Documents carry `odrs_version`. Rules, including the pre-1.0 breaking-change
policy and the prohibition on reusing a field name with a different meaning,
live in [GOVERNANCE.md](../../GOVERNANCE.md) §5 and are normative.

---

## 6. Advisory checks (SHOULD-level)

A conforming validator SHOULD warn (not error) when a valid document omits:
`environment` / `environment.realism`; `licensing`; `acceptance` (or
`acceptance.sample`); `diversity` on orders ≥ 1,000 episodes/demonstrations/
hours; `capture.action_space` on robot manipulation; `episode_duration_seconds`
on episode-counted orders; `delivery.format`; `publication.contact` on
public/anonymous requests; `id` on published requests — and when
`capture.sensors` names a modality absent from `modalities`, or a deadline is
past. The reference validator implements exactly this list.

---

## 7. Privacy and security considerations

- Published requests are procurement signals; anonymous visibility exists
  because a data requirement can reveal a buyer's capability bottleneck and
  roadmap. Platforms MUST NOT require identity inside the document itself.
- No personal information belongs in a published ODRS document. Country-level
  geography only; pseudonymous operator/participant identifiers in
  `metadata.required` (e.g. `operator_id_pseudonymous`), never names.
- ULID timestamps leak drafting time (§3).
- Consent and provenance are first-class licensing flags because retrofitting
  them after collection is generally impossible.
- ODRS documents are data, not code. Parsers MUST treat all string content as
  inert; renderers MUST NOT execute or interpolate document content.

---

## 8. What ODRS v0.1 is not

Not a payment protocol, escrow system, legal contract format, identity
system, dataset storage format, universal robotics ontology, quality score,
or matching algorithm — see GOVERNANCE.md §9 for the scope commitment.
Future objects (`capability`, `offer`, `dataset`, `attestation`) are named in
the [roadmap](../../README.md#roadmap) and deliberately unspecified here.

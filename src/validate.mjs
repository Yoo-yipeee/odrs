// ODRS document validation — all object types, both spec versions.
//
// Dispatch: a document declares `type` (data_request | capability | offer |
// dataset | attestation) and `odrs_version` (0.1 | 0.2). v0.1 defines only
// data_request; v0.2 adds the other four and leaves data_request unchanged.
// Published spec versions are immutable: the v0.1 schema keeps validating
// v0.1 documents forever.
//
// Two layers, deliberately separate:
//   errors   — schema violations; the document is not valid ODRS.
//   warnings — valid but omits things that historically cause disputes
//              (SHOULD-level lint). The schema is the source of truth; the
//              linter only covers what a schema cannot express.

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const specPath = (v, f) => join(here, "..", "spec", v, f);

export const SCHEMA_PATH = specPath("v0.1", "data-request.schema.json");
export const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

const SCHEMA_FILES = {
  "0.1": { data_request: specPath("v0.1", "data-request.schema.json") },
  "0.2": {
    data_request: specPath("v0.2", "data-request.schema.json"),
    capability: specPath("v0.2", "capability.schema.json"),
    offer: specPath("v0.2", "offer.schema.json"),
    dataset: specPath("v0.2", "dataset.schema.json"),
    attestation: specPath("v0.2", "attestation.schema.json"),
  },
};

export const OBJECT_TYPES = ["data_request", "capability", "offer", "dataset", "attestation"];
export const SPEC_VERSIONS = Object.keys(SCHEMA_FILES);

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: true });
addFormats(ajv);

const compiled = {};
for (const [version, types] of Object.entries(SCHEMA_FILES)) {
  compiled[version] = {};
  for (const [type, file] of Object.entries(types)) {
    compiled[version][type] = ajv.compile(JSON.parse(readFileSync(file, "utf8")));
  }
}

/** "/data/quantity/unit" -> "data.quantity.unit" */
function dotted(instancePath) {
  if (!instancePath) return "(document root)";
  return instancePath.slice(1).replaceAll("/", ".");
}

function show(v) {
  if (v === undefined) return "undefined";
  const s = typeof v === "string" ? `'${v}'` : JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 57) + "..." : s;
}

const ID_HINT = {
  dr_: "request ids are 'dr_' + 26-char Crockford-base32 ULID",
  cap_: "capability ids are 'cap_' + 26-char Crockford-base32 ULID",
  off_: "offer ids are 'off_' + 26-char Crockford-base32 ULID",
  dat_: "dataset ids are 'dat_' + 26-char Crockford-base32 ULID",
  att_: "attestation ids are 'att_' + 26-char Crockford-base32 ULID",
};

/** Turn an ajv error into something a human can act on. */
function humanize(e) {
  const path = dotted(e.instancePath);
  switch (e.keyword) {
    case "required":
      return `${path}: missing required field '${e.params.missingProperty}'`;
    case "enum": {
      const allowed = e.params.allowedValues.join(", ");
      return `${path}: ${show(e.data)} is not an allowed value (allowed: ${allowed})`;
    }
    case "const":
      return `${path}: must be ${show(e.params.allowedValue)}, got ${show(e.data)}`;
    case "pattern": {
      if (/(^|\.)id$/.test(path) || e.instancePath === "/id" || /request|capability|offer|dataset|attestation|subject/.test(path)) {
        const prefix = Object.keys(ID_HINT).find((p) => e.params.pattern.includes(p.slice(0, -1)));
        if (prefix) return `${path}: ${show(e.data)} is not a valid ODRS id (${ID_HINT[prefix]})`;
      }
      if (e.instancePath === "/odrs_version")
        return `odrs_version: ${show(e.data)} is not a version this schema accepts (this validator knows ${SPEC_VERSIONS.join(", ")})`;
      if (/geography|collection|available/.test(path))
        return `${path}: ${show(e.data)} is not an ISO 3166-1 alpha-2 country code (two uppercase letters, e.g. 'IN' not 'IND' or 'India')`;
      if (/currency/.test(path))
        return `${path}: ${show(e.data)} is not an ISO 4217 currency code (three uppercase letters, e.g. 'USD')`;
      return `${path}: ${show(e.data)} does not match required pattern ${e.params.pattern}`;
    }
    case "type":
      return `${path}: expected ${e.params.type}, got ${show(e.data)}`;
    case "format":
      return `${path}: ${show(e.data)} is not a valid ${e.params.format}` +
        (e.params.format === "date" ? " (use ISO 8601, e.g. 2026-12-01)" : "");
    case "dependentRequired":
      return `${path}: when '${e.params.property}' is present, '${e.params.missingProperty}' is required` +
        (/budget|pricing/.test(path + e.instancePath) ? " — a figure without a basis (total vs per_unit) is not comparable" : "");
    case "propertyNames":
      return `${path}: invalid name ${show(e.data)} (extension namespaces are lowercase identifiers or reverse-DNS, e.g. 'tactile' or 'com.example.procurement')`;
    case "additionalProperties":
      return `${path}: unknown field '${e.params.additionalProperty}' not permitted here`;
    case "minItems":
      return `${path}: must contain at least ${e.params.limit} item(s)`;
    case "uniqueItems":
      return `${path}: duplicate entries are not permitted`;
    case "exclusiveMinimum":
    case "minimum":
    case "maximum":
    case "exclusiveMaximum":
      return `${path}: value ${show(e.data)} violates ${e.keyword} ${e.params.limit}`;
    case "maxLength":
      return `${path}: exceeds maximum length ${e.params.limit}`;
    default:
      return `${path}: ${e.message}`;
  }
}

const ROBOT_EMBODIMENTS = new Set([
  "humanoid", "robotic_arm", "bimanual_arm", "mobile_robot",
  "mobile_manipulator", "quadruped", "drone", "autonomous_vehicle", "exoskeleton",
]);

// ---------------------------------------------------------------- linters

function lintRequest(doc, { now = new Date() } = {}) {
  const w = [];
  const vis = doc.publication?.visibility;

  if (!doc.environment)
    w.push("environment not specified — suppliers cannot price a request without knowing where collection happens");
  if (doc.environment && !doc.environment.realism)
    w.push("environment.realism not specified — an in-the-wild site and a lab mockup differ by roughly an order of magnitude in cost");
  if (!doc.licensing)
    w.push("licensing not specified — rights are the first thing a commercial supplier checks");
  if (!doc.acceptance)
    w.push("acceptance not specified — without acceptance criteria, delivery disputes are settled by argument instead of measurement; consider at least a sample gate");
  if (doc.acceptance && !doc.acceptance.sample)
    w.push("acceptance.sample not specified — procurement in this market is sample-gated; committing a full order without a sample gate is unusual");

  const qty = doc.data?.quantity;
  const bulkUnits = new Set(["episode", "demonstration", "hour"]);
  if (qty && bulkUnits.has(qty.unit) && qty.value >= 1000 && !doc.diversity)
    w.push("diversity not specified for a large order — quantity without diversity constraints is a common and expensive specification error");

  if (
    doc.task?.category === "manipulation" &&
    ROBOT_EMBODIMENTS.has(doc.embodiment?.type) &&
    !doc.capture?.action_space
  )
    w.push("capture.action_space not specified for robot manipulation — omitting the action representation is the most common cause of an unusable delivery");

  if (qty && ["episode", "demonstration"].includes(qty.unit) && !doc.data?.episode_duration_seconds)
    w.push("data.episode_duration_seconds not specified — an episode count without duration bounds is unpriceable");

  if (Array.isArray(doc.capture?.sensors) && Array.isArray(doc.modalities)) {
    const declared = new Set(doc.modalities);
    for (const s of doc.capture.sensors) {
      if (s.modality && !declared.has(s.modality))
        w.push(`capture.sensors includes '${s.modality}' which is absent from modalities — where both are present they must be consistent, and capture.sensors is authoritative`);
    }
  }

  if ((vis === "public" || vis === "anonymous") && !doc.publication?.contact)
    w.push("publication.contact not specified on a published request — a request with no return path is a broadcast into a void");

  if ((vis === "public" || vis === "anonymous" || doc.publication?.status === "open") && !doc.id)
    w.push("id not specified — an id is required once a request is published to any registry");

  const deadline = doc.delivery?.deadline;
  if (deadline && !Number.isNaN(Date.parse(deadline)) && new Date(deadline) < now)
    w.push(`delivery.deadline ${deadline} is in the past`);

  if (!doc.delivery?.format?.standard || doc.delivery?.format?.standard === "unspecified")
    w.push("delivery.format not specified — naming a target format (lerobot, rlds, hdf5, ...) removes the most common source of post-delivery rework");

  if (doc.economics?.budget && !doc.economics.pricing_model)
    w.push("economics.pricing_model not specified alongside a budget — state fixed_budget, price_discovery or market_rate");

  return w;
}

function lintCapability(doc) {
  const w = [];
  if (!doc.tasks?.length && !doc.embodiments?.length && !doc.modalities?.length)
    w.push("no tasks, embodiments or modalities declared — a capability that says nothing about what it can capture cannot be matched to any request");
  if (!doc.geography?.available?.length)
    w.push("geography.available not specified — collection geography is a hard constraint in most requests, and a capability without it cannot be matched");
  if (doc.demonstrated?.length) {
    for (const [i, d] of doc.demonstrated.entries()) {
      if (!d.evidence_uri && !d.attestation)
        w.push(`demonstrated[${i}] ('${d.metric}') has no evidence_uri or attestation — unevidenced claims are marketing, and consumers are told to weight them accordingly`);
    }
  }
  if (!doc.licensing_available)
    w.push("licensing_available not specified — buyers filter on grantable rights before anything else");
  if (doc.publication?.visibility === "public" && !doc.publication?.contact)
    w.push("publication.contact not specified on a public capability — suppliers exist to be contacted");
  if (!doc.id && doc.publication?.visibility === "public")
    w.push("id not specified — an id is required once a capability is published");
  return w;
}

function lintOffer(doc, { now = new Date() } = {}) {
  const w = [];
  if (!doc.pricing)
    w.push("pricing not specified — an offer without a price is an expression of interest; buyers compare priced offers first");
  if (!doc.sample)
    w.push("sample terms not specified — the request's sample gate is where engagements actually start; propose terms for it");
  if (doc.deviations?.length) {
    for (const [i, d] of doc.deviations.entries()) {
      if (!d.note)
        w.push(`deviations[${i}] ('${d.path}') has no note — a deviation without a why reads as a defect instead of a trade-off`);
    }
  } else if (doc.deviations === undefined) {
    w.push("deviations not declared — if this offer meets the full spec, state an empty deviations list explicitly; silence and conformance are not the same thing");
  }
  if (!doc.delivery?.deadline)
    w.push("delivery.deadline not specified — an offer without a completion date cannot be compared");
  const exp = doc.validity?.expires_at;
  if (exp && !Number.isNaN(Date.parse(exp)) && new Date(exp) < now)
    w.push(`validity.expires_at ${exp} is in the past — this offer has lapsed`);
  if (!doc.contact && !doc.capability)
    w.push("no contact and no capability reference — the buyer has no route back to you");
  return w;
}

function lintDataset(doc) {
  const w = [];
  if (!doc.location?.checksum)
    w.push("location.checksum not specified — without a checksum, attestations and licenses bind to nothing in particular");
  if (!doc.format?.standard)
    w.push("format not specified — a delivery manifest that does not name its format defers the first question every consumer asks");
  if (!doc.licensing)
    w.push("licensing not specified — an artifact without granted rights cannot be used");
  if (!doc.measured?.length)
    w.push("measured actuals not reported — deliveries against acceptance criteria should ship the supplier's own numbers for the buyer to verify");
  if (doc.fulfills?.request && !doc.fulfills?.portion)
    w.push("fulfills.portion not specified — is this the sample, a tranche, or the final delivery?");
  if (doc.provenance?.pii_treatment === undefined && doc.content?.modalities?.some((m) => ["rgb", "rgbd", "audio", "eye_gaze", "body_pose"].includes(m)))
    w.push("provenance.pii_treatment not specified for human-observable modalities — state how people in the recordings were handled");
  return w;
}

function lintAttestation(doc) {
  const w = [];
  if (doc.subject?.type === "dataset" && !doc.subject?.checksum)
    w.push("subject.checksum not specified — an attestation about a dataset should bind to the exact artifact examined");
  if (doc.claims?.length) {
    for (const [i, c] of doc.claims.entries()) {
      if ((c.verdict === "pass" || c.verdict === "fail") && c.threshold === undefined)
        w.push(`claims[${i}] ('${c.property}') has a ${c.verdict} verdict but no threshold — state what the value was judged against`);
      if (!c.evidence_uri && doc.attestor?.role === "third_party")
        w.push(`claims[${i}] ('${c.property}') from a third-party attestor has no evidence_uri — independent verification is only as good as its audit trail`);
    }
  }
  if (!doc.scope)
    w.push("scope not specified — claims over a 50-episode sample and over the full corpus are different statements");
  return w;
}

const LINTERS = {
  data_request: lintRequest,
  capability: lintCapability,
  offer: lintOffer,
  dataset: lintDataset,
  attestation: lintAttestation,
};

// ------------------------------------------------------------------- API

/**
 * Validate any ODRS document. Dispatches on `type` and `odrs_version`.
 * @returns {{valid: boolean, errors: string[], warnings: string[], objectType?: string, specVersion?: string}}
 */
export function validateDocument(doc, opts = {}) {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { valid: false, errors: ["document must be a JSON/YAML object"], warnings: [] };
  }
  const version = typeof doc.odrs_version === "string" ? doc.odrs_version.split(".").slice(0, 2).join(".") : null;
  const type = doc.type;

  if (!version || !SCHEMA_FILES[version]) {
    return {
      valid: false,
      errors: [`odrs_version: ${show(doc.odrs_version)} is not a version this validator knows (supported: ${SPEC_VERSIONS.join(", ")})`],
      warnings: [],
    };
  }
  if (!OBJECT_TYPES.includes(type)) {
    return {
      valid: false,
      errors: [`type: ${show(type)} is not an ODRS object type (expected one of: ${OBJECT_TYPES.join(", ")})`],
      warnings: [],
    };
  }
  const validator = compiled[version][type];
  if (!validator) {
    return {
      valid: false,
      errors: [`type '${type}' does not exist in ODRS v${version} — it was introduced in v0.2`],
      warnings: [],
    };
  }

  const valid = validator(doc);
  if (!valid) {
    const errors = [...new Set(validator.errors.map(humanize))];
    return { valid: false, errors, warnings: [], objectType: type, specVersion: version };
  }
  const warnings = (LINTERS[type] ?? (() => []))(doc, opts);
  return { valid: true, errors: [], warnings, objectType: type, specVersion: version };
}

/**
 * Validate a data request (back-compat API; accepts v0.1 and v0.2 requests).
 */
export function validateRequest(doc, opts = {}) {
  if (doc !== null && typeof doc === "object" && !Array.isArray(doc) && doc.type !== undefined && doc.type !== "data_request") {
    return { valid: false, errors: [`type: expected 'data_request', got ${show(doc.type)} — use validateDocument() for other object types`], warnings: [] };
  }
  const { valid, errors, warnings } = validateDocument(doc, opts);
  return { valid, errors, warnings };
}

/** SHOULD-level lint only (assumes a schema-valid document). */
export function lint(doc, opts = {}) {
  const type = doc?.type ?? "data_request";
  return (LINTERS[type] ?? (() => []))(doc, opts);
}

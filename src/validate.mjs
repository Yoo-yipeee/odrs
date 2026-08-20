// ODRS document validation.
//
// Two layers, deliberately separate:
//   errors   — violations of the JSON Schema. The document is not a valid
//              ODRS data request.
//   warnings — the document is valid, but omits fields that experience says
//              lead to disputes or unanswerable requests (SHOULD-level lint).
//
// The schema is the source of truth; this module never invents constraints
// that belong in the schema. The linter only flags omissions and
// inconsistencies the schema cannot express.

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = join(here, "..", "spec", "v0.1", "data-request.schema.json");
export const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: true });
addFormats(ajv);
const compiled = ajv.compile(schema);

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
      if (e.instancePath === "/id")
        return `id: ${show(e.data)} is not a valid ODRS id (expected 'dr_' + 26-char Crockford-base32 ULID, e.g. dr_01JBQZK7X4M9NPRSTVWXYZ2A3B)`;
      if (e.instancePath === "/odrs_version")
        return `odrs_version: ${show(e.data)} is not a version this validator accepts (expected 0.1 or 0.1.x)`;
      if (/geography/.test(e.instancePath))
        return `${path}: ${show(e.data)} is not an ISO 3166-1 alpha-2 country code (two uppercase letters, e.g. 'IN' not 'IND' or 'India')`;
      if (/currency/.test(e.instancePath))
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
        (/budget/.test(e.instancePath) ? " — a budget without a basis (total vs per_unit) is not comparable" : "");
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

/**
 * SHOULD-level lint. Only runs on schema-valid documents.
 * Each warning names the field and says why it matters, briefly.
 */
export function lint(doc, { now = new Date() } = {}) {
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

  if (qty && bulkUnits.has(qty.unit) && ["episode", "demonstration"].includes(qty.unit) && !doc.data?.episode_duration_seconds)
    w.push("data.episode_duration_seconds not specified — an episode count without duration bounds is unpriceable");

  // modalities vs capture.sensors consistency (schema cannot cross-check arrays)
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

/**
 * Validate a parsed ODRS document.
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateRequest(doc, opts = {}) {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { valid: false, errors: ["document must be a JSON/YAML object"], warnings: [] };
  }
  const valid = compiled(doc);
  if (!valid) {
    // ajv reports some failures twice (e.g. via if/then); dedupe on message.
    const errors = [...new Set(compiled.errors.map(humanize))];
    return { valid: false, errors, warnings: [] };
  }
  return { valid: true, errors: [], warnings: lint(doc, opts) };
}

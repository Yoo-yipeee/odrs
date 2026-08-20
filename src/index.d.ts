// Type declarations for @odrs/core.
// The JSON Schema remains the source of truth; these types describe the
// reference implementation's public API, not the document shape (documents
// are intentionally open — validate them, don't trust a cast).

export interface ValidationResult {
  valid: boolean;
  /** Humanized schema violations. Empty when valid. */
  errors: string[];
  /** SHOULD-level advisory warnings. Empty when invalid. */
  warnings: string[];
}

/** Validate a data request (v0.1 or v0.2) against schema + lint rules. */
export function validateRequest(doc: unknown, opts?: { now?: Date }): ValidationResult;

export interface DocumentValidationResult extends ValidationResult {
  /** The dispatched object type, when the document declared a known one. */
  objectType?: "data_request" | "capability" | "offer" | "dataset" | "attestation";
  /** The spec version the document was validated against. */
  specVersion?: string;
}

/** Validate ANY ODRS object; dispatches on `type` + `odrs_version`. */
export function validateDocument(doc: unknown, opts?: { now?: Date }): DocumentValidationResult;

/** Object types known to this implementation. */
export const OBJECT_TYPES: readonly string[];

/** Spec versions known to this implementation. */
export const SPEC_VERSIONS: readonly string[];

/** SHOULD-level lint only (assumes a schema-valid document). */
export function lint(doc: unknown, opts?: { now?: Date }): string[];

/** The parsed JSON Schema object (draft 2020-12). */
export const schema: Record<string, unknown>;

/** Absolute path to the schema file inside this package. */
export const SCHEMA_PATH: string;

/** Render a request as the reference human-readable summary. */
export function renderRequest(doc: unknown): string;

/** Render ANY ODRS document, dispatching on type. */
export function renderDocument(doc: unknown): string;
export function renderCapability(doc: unknown): string;
export function renderOffer(doc: unknown): string;
export function renderDataset(doc: unknown): string;
export function renderAttestation(doc: unknown): string;

/** Machine-readable structural summary of a request. */
export function inspectRequest(doc: unknown): Record<string, unknown>;

/** Mint a request id: "dr_" + 26-char Crockford-base32 ULID. */
export function requestId(timestamp?: number): string;

/** Mint an id for any object type ("capability" -> "cap_...", etc.). */
export function objectId(
  objectType: "data_request" | "capability" | "offer" | "dataset" | "attestation",
  timestamp?: number
): string;

/** Map of object type -> id prefix. */
export const OBJECT_PREFIXES: Record<string, string>;

/** Pattern matching any ODRS object id. */
export const ANY_ID_PATTERN: RegExp;

/** Raw ULID generator. */
export function ulid(timestamp?: number): string;

/** Pattern every published request id must match. */
export const ID_PATTERN: RegExp;

/** Read + parse a YAML or JSON ODRS document from disk (strips BOM). */
export function loadDocument(path: string): unknown;

/** Specification version implemented by this package. */
export const SPEC_VERSION: string;

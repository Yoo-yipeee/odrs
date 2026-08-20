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

/** Validate a parsed ODRS document against the v0.1 schema + lint rules. */
export function validateRequest(doc: unknown, opts?: { now?: Date }): ValidationResult;

/** SHOULD-level lint only (assumes a schema-valid document). */
export function lint(doc: unknown, opts?: { now?: Date }): string[];

/** The parsed JSON Schema object (draft 2020-12). */
export const schema: Record<string, unknown>;

/** Absolute path to the schema file inside this package. */
export const SCHEMA_PATH: string;

/** Render a request as the reference human-readable summary. */
export function renderRequest(doc: unknown): string;

/** Machine-readable structural summary of a request. */
export function inspectRequest(doc: unknown): Record<string, unknown>;

/** Mint a request id: "dr_" + 26-char Crockford-base32 ULID. */
export function requestId(timestamp?: number): string;

/** Raw ULID generator. */
export function ulid(timestamp?: number): string;

/** Pattern every published request id must match. */
export const ID_PATTERN: RegExp;

/** Read + parse a YAML or JSON ODRS document from disk (strips BOM). */
export function loadDocument(path: string): unknown;

/** Specification version implemented by this package. */
export const SPEC_VERSION: string;

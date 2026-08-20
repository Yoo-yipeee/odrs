// @odrs/core — public API.
//
// The JSON Schema (spec/v0.1/data-request.schema.json) is the source of
// truth. This package is a thin, convenient wrapper around it, not a second
// definition of the specification.

export { validateRequest, lint, schema, SCHEMA_PATH } from "./validate.mjs";
export { renderRequest, inspectRequest } from "./render.mjs";
export { requestId, ulid, ID_PATTERN } from "./ulid.mjs";
export { loadDocument } from "./load.mjs";

export const SPEC_VERSION = "0.1";

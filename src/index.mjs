// @odrs/core — public API.
//
// The JSON Schema (spec/v0.1/data-request.schema.json) is the source of
// truth. This package is a thin, convenient wrapper around it, not a second
// definition of the specification.

export { validateRequest, validateDocument, lint, schema, SCHEMA_PATH, OBJECT_TYPES, SPEC_VERSIONS } from "./validate.mjs";
export { renderRequest, renderDocument, renderCapability, renderOffer, renderDataset, renderAttestation, inspectRequest } from "./render.mjs";
export { requestId, objectId, ulid, ID_PATTERN, ANY_ID_PATTERN, OBJECT_PREFIXES } from "./ulid.mjs";
export { loadDocument } from "./load.mjs";

export const SPEC_VERSION = "0.2";

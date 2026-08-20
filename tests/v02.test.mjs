// ODRS v0.2 conformance tests: the full object family.
//
//   1. Every v0.2 example (capabilities + the linked exchange set) validates.
//   2. The exchange set's cross-references are consistent.
//   3. Version/type dispatch behaves: v0.1 requests still validate, v0.1
//      capabilities are rejected, unknown types/versions error cleanly.
//   4. Per-type invalid fixtures fail for the documented reason.
//   5. Per-type linters flag the expensive omissions.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { validateDocument, validateRequest } from "../src/validate.mjs";
import { renderDocument } from "../src/render.mjs";
import { loadDocument } from "../src/load.mjs";
import { objectId, ANY_ID_PATTERN } from "../src/ulid.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const EX = join(here, "..", "spec", "v0.2", "examples");

// ------------------------------------------------------------- examples

const exampleFiles = [
  ...readdirSync(EX).filter((f) => /\.(ya?ml|json)$/.test(f)).map((f) => join(EX, f)),
  ...readdirSync(join(EX, "exchange")).filter((f) => /\.(ya?ml|json)$/.test(f)).map((f) => join(EX, "exchange", f)),
];

test("v0.2 example corpus present", () => {
  assert.ok(exampleFiles.length >= 6, `expected >= 6 v0.2 examples, found ${exampleFiles.length}`);
});

for (const f of exampleFiles) {
  test(`v0.2 example validates and renders: ${f.split(/[\\/]/).slice(-2).join("/")}`, () => {
    const doc = loadDocument(f);
    const r = validateDocument(doc);
    assert.deepEqual(r.errors, [], `errors in ${f}`);
    assert.ok(r.valid);
    const out = renderDocument(doc);
    assert.ok(out.includes("ODRS"), "render header missing");
    assert.ok(out.includes(doc.odrs_version), "version footer missing");
  });
}

test("exchange set cross-references are consistent", () => {
  const req = loadDocument(join(EX, "exchange", "1-request.yaml"));
  const off = loadDocument(join(EX, "exchange", "2-offer.yaml"));
  const dat = loadDocument(join(EX, "exchange", "3-dataset.yaml"));
  const att = loadDocument(join(EX, "exchange", "4-attestation.yaml"));

  assert.equal(off.request, req.id, "offer must reference the request");
  assert.equal(dat.fulfills.request, req.id, "dataset must reference the request");
  assert.equal(dat.fulfills.offer, off.id, "dataset must reference the offer");
  assert.equal(att.subject.id, dat.id, "attestation must reference the dataset");
  assert.equal(att.subject.checksum.value, dat.location.checksum.value, "attestation checksum must bind to the dataset artifact");

  // The attestation's criterion ids must exist in the request's acceptance block.
  const criterionIds = new Set(req.acceptance.criteria.map((c) => c.id));
  for (const claim of att.claims) {
    if (claim.criterion_id) assert.ok(criterionIds.has(claim.criterion_id), `unknown criterion_id ${claim.criterion_id}`);
  }

  // The offer's deviation paths must resolve to real values in the request.
  for (const d of off.deviations) {
    let cursor = req;
    for (const seg of d.path.split(".")) {
      assert.ok(cursor !== undefined && cursor !== null, `deviation path ${d.path} does not resolve in the request`);
      cursor = cursor[seg];
    }
    assert.deepEqual(cursor, d.requested, `deviation ${d.path}: 'requested' must mirror the request's actual value`);
  }
});

// ------------------------------------------------------------- dispatch

const MIN_CAP = {
  odrs_version: "0.2",
  type: "capability",
  provider: { type: "organization", name: "T" },
  capacity: { value: 100, unit: "episode", per: "month" },
};

test("dispatch: v0.1 request still validates via validateDocument", () => {
  const r = validateDocument({
    odrs_version: "0.1",
    type: "data_request",
    task: { category: "manipulation" },
    data: { quantity: { value: 10, unit: "episode" } },
  });
  assert.ok(r.valid, r.errors.join("; "));
  assert.equal(r.specVersion, "0.1");
});

test("dispatch: capability under v0.1 is rejected with a clear message", () => {
  const r = validateDocument({ ...MIN_CAP, odrs_version: "0.1" });
  assert.equal(r.valid, false);
  assert.ok(r.errors[0].includes("introduced in v0.2"), r.errors[0]);
});

test("dispatch: unknown version and unknown type error cleanly", () => {
  assert.equal(validateDocument({ odrs_version: "0.9", type: "data_request" }).valid, false);
  assert.equal(validateDocument({ odrs_version: "0.2", type: "wish" }).valid, false);
});

test("validateRequest rejects non-request types with guidance", () => {
  const r = validateRequest(MIN_CAP);
  assert.equal(r.valid, false);
  assert.ok(r.errors[0].includes("validateDocument"), r.errors[0]);
});

// ------------------------------------------------------- invalid fixtures

const badCases = [
  ["capability without capacity", { ...MIN_CAP, capacity: undefined }, "missing required field 'capacity'"],
  ["capability with bad capacity.per", { ...MIN_CAP, capacity: { value: 1, unit: "episode", per: "day" } }, "not an allowed value"],
  ["offer without request ref", { odrs_version: "0.2", type: "offer", quantity: { value: 10, unit: "episode" } }, "missing required field 'request'"],
  ["offer with malformed request ref", { odrs_version: "0.2", type: "offer", request: "dr_short", quantity: { value: 10, unit: "episode" } }, "not a valid ODRS id"],
  ["offer pricing without basis", { odrs_version: "0.2", type: "offer", request: `dr_${"0".repeat(26)}`.replace(/0{26}/, "01M0FFJ4STVWXYZ4C5D6E7F8G9"), quantity: { value: 10, unit: "episode" }, pricing: { amount: 5, currency: "USD" } }, "'basis' is required"],
  ["deviation without proposed", { odrs_version: "0.2", type: "offer", request: "dr_01M0FFJ4STVWXYZ4C5D6E7F8G9", quantity: { value: 10, unit: "episode" }, deviations: [{ path: "x" }] }, "missing required field 'proposed'"],
  ["dataset without content", { odrs_version: "0.2", type: "dataset" }, "missing required field 'content'"],
  ["dataset checksum without algorithm", { odrs_version: "0.2", type: "dataset", content: { quantity: { value: 1, unit: "episode" } }, location: { checksum: { value: "ab" } } }, "missing required field 'algorithm'"],
  ["attestation without claims", { odrs_version: "0.2", type: "attestation", subject: { type: "dataset", id: "dat_01M0FFM6VWXYZ6E7F8G9H0J1K2" }, attestor: { role: "buyer" }, issued_at: "2026-01-01T00:00:00Z" }, "missing required field 'claims'"],
  ["attestation with empty claims", { odrs_version: "0.2", type: "attestation", subject: { type: "dataset", id: "dat_01M0FFM6VWXYZ6E7F8G9H0J1K2" }, attestor: { role: "buyer" }, claims: [], issued_at: "2026-01-01T00:00:00Z" }, "at least 1"],
  ["claim without measurement", { odrs_version: "0.2", type: "attestation", subject: { type: "dataset", id: "dat_01M0FFM6VWXYZ6E7F8G9H0J1K2" }, attestor: { role: "buyer" }, claims: [{ property: "x", verdict: "pass" }], issued_at: "2026-01-01T00:00:00Z" }, "missing required field 'measurement'"],
  ["attestation subject with wrong prefix", { odrs_version: "0.2", type: "attestation", subject: { type: "dataset", id: "xx_01M0FFM6VWXYZ6E7F8G9H0J1K2" }, attestor: { role: "buyer" }, claims: [{ property: "x", verdict: "pass", measurement: "m" }], issued_at: "2026-01-01T00:00:00Z" }, "not a valid ODRS id"],
];

for (const [name, doc, expected] of badCases) {
  test(`invalid v0.2 rejected: ${name}`, () => {
    const cleaned = JSON.parse(JSON.stringify(doc));
    const r = validateDocument(cleaned);
    assert.equal(r.valid, false, `${name} unexpectedly validated`);
    assert.ok(
      r.errors.some((e) => e.includes(expected)),
      `${name}: no error containing '${expected}'.\nGot:\n  ${r.errors.join("\n  ")}`
    );
  });
}

// ---------------------------------------------------------------- linters

test("capability linter flags unmatchable and unevidenced capabilities", () => {
  const r = validateDocument(MIN_CAP);
  const text = r.warnings.join(" | ");
  assert.ok(text.includes("cannot be matched to any request"), text);
  assert.ok(text.includes("geography.available"), text);
});

test("offer linter flags undeclared deviations and missing pricing", () => {
  const r = validateDocument({
    odrs_version: "0.2",
    type: "offer",
    request: "dr_01M0FFJ4STVWXYZ4C5D6E7F8G9",
    quantity: { value: 10, unit: "episode" },
  });
  const text = r.warnings.join(" | ");
  assert.ok(text.includes("deviations not declared"), text);
  assert.ok(text.includes("pricing"), text);
});

test("offer with explicit empty deviations is not warned about deviations", () => {
  const r = validateDocument({
    odrs_version: "0.2",
    type: "offer",
    request: "dr_01M0FFJ4STVWXYZ4C5D6E7F8G9",
    quantity: { value: 10, unit: "episode" },
    deviations: [],
  });
  assert.ok(!r.warnings.some((w) => w.includes("deviations not declared")));
});

test("dataset linter flags missing checksum and pii treatment", () => {
  const r = validateDocument({
    odrs_version: "0.2",
    type: "dataset",
    content: { quantity: { value: 100, unit: "episode" }, modalities: ["rgb"] },
  });
  const text = r.warnings.join(" | ");
  assert.ok(text.includes("checksum"), text);
  assert.ok(text.includes("pii_treatment"), text);
});

test("attestation linter demands thresholds on pass/fail verdicts", () => {
  const r = validateDocument({
    odrs_version: "0.2",
    type: "attestation",
    subject: { type: "dataset", id: "dat_01M0FFM6VWXYZ6E7F8G9H0J1K2" },
    attestor: { role: "buyer" },
    claims: [{ property: "sync_error_ms", verdict: "pass", value: 9, measurement: "checked" }],
    issued_at: "2026-01-01T00:00:00Z",
  });
  assert.ok(r.warnings.some((w) => w.includes("no threshold")), r.warnings.join("; "));
});

// -------------------------------------------------------------------- ids

test("objectId mints valid prefixed ids for every type", () => {
  for (const t of ["data_request", "capability", "offer", "dataset", "attestation"]) {
    const id = objectId(t);
    assert.match(id, ANY_ID_PATTERN, `bad id for ${t}: ${id}`);
  }
  assert.throws(() => objectId("wish"));
});

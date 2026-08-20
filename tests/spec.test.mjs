// ODRS conformance tests.
//
//   1. Every published example validates.
//   2. Every invalid fixture is rejected — for the documented reason,
//      not incidentally.
//   3. Structural guarantees: forward compatibility, the minimal document,
//      the no-embodiment (human demonstration) case, id generation.
//   4. The renderer produces output for every valid example.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { validateRequest, lint } from "../src/validate.mjs";
import { renderRequest, inspectRequest } from "../src/render.mjs";
import { loadDocument } from "../src/load.mjs";
import { requestId, ID_PATTERN } from "../src/ulid.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(here, "..", "spec", "v0.1", "examples");
const INVALID = join(here, "invalid");

const exampleFiles = readdirSync(EXAMPLES).filter((f) => /\.(ya?ml|json)$/.test(f));

// ---------------------------------------------------------------- examples

test("example corpus is present", () => {
  assert.ok(exampleFiles.length >= 10, `expected >= 10 examples, found ${exampleFiles.length}`);
});

for (const f of exampleFiles) {
  test(`example validates: ${f}`, () => {
    const doc = loadDocument(join(EXAMPLES, f));
    const r = validateRequest(doc);
    assert.deepEqual(r.errors, [], `errors in ${f}`);
    assert.ok(r.valid);
  });

  test(`example renders: ${f}`, () => {
    const doc = loadDocument(join(EXAMPLES, f));
    const out = renderRequest(doc);
    assert.ok(out.includes("ODRS DATA REQUEST"), "render header missing");
    assert.ok(out.includes(doc.odrs_version), "version footer missing");
    const summary = inspectRequest(doc);
    assert.equal(summary.odrs_version, doc.odrs_version);
  });
}

// ------------------------------------------------------- invalid fixtures

const manifest = JSON.parse(readFileSync(join(INVALID, "manifest.json"), "utf8"));
const fixtureNames = Object.keys(manifest).filter((k) => k !== "$comment");

test("every invalid fixture is covered by the manifest", () => {
  const onDisk = readdirSync(INVALID).filter((f) => f.endsWith(".json") && f !== "manifest.json");
  assert.deepEqual(onDisk.sort(), fixtureNames.sort());
});

for (const [file, expected] of Object.entries(manifest)) {
  if (file === "$comment") continue;
  test(`invalid fixture rejected for the right reason: ${file}`, () => {
    const doc = loadDocument(join(INVALID, file));
    const r = validateRequest(doc);
    assert.equal(r.valid, false, `${file} unexpectedly validated`);
    assert.ok(
      r.errors.some((e) => e.includes(expected)),
      `${file}: no error containing '${expected}'.\nGot:\n  ${r.errors.join("\n  ")}`
    );
  });
}

// ------------------------------------------------- structural guarantees

const MINIMAL = {
  odrs_version: "0.1",
  type: "data_request",
  task: { category: "manipulation" },
  data: { quantity: { value: 500, unit: "episode" } },
};

test("minimal four-field document is valid", () => {
  const r = validateRequest(MINIMAL);
  assert.ok(r.valid, r.errors.join("; "));
});

test("forward compatibility: unknown fields are accepted, never rejected", () => {
  const d = structuredClone(MINIMAL);
  d.some_future_top_level_field = { anything: true };
  d.task.some_future_subfield = "ok";
  const r = validateRequest(d);
  assert.ok(r.valid, r.errors.join("; "));
});

test("human demonstration needs no robot embodiment", () => {
  const d = {
    odrs_version: "0.1",
    type: "data_request",
    task: { category: "human_demonstration", type: "kitchen_food_prep" },
    embodiment: { type: "human" },
    data: { quantity: { value: 2000, unit: "hour" } },
    modalities: ["rgb", "hand_pose", "eye_gaze"],
  };
  const r = validateRequest(d);
  assert.ok(r.valid, r.errors.join("; "));
});

test("budget without basis is rejected; with basis is accepted", () => {
  const bad = structuredClone(MINIMAL);
  bad.economics = { budget: { min: 1000, max: 2000, currency: "USD" } };
  assert.equal(validateRequest(bad).valid, false);

  const good = structuredClone(MINIMAL);
  good.economics = { budget: { min: 1000, max: 2000, currency: "USD", basis: "total" } };
  assert.ok(validateRequest(good).valid);
});

test("acceptance criterion requires a measurement method", () => {
  const d = structuredClone(MINIMAL);
  d.acceptance = {
    criteria: [{ metric: "task_success_rate", operator: "gte", value: 0.9, measurement: "judged by two reviewers on 400 episodes" }],
  };
  assert.ok(validateRequest(d).valid);
});

// ---------------------------------------------------------------- linter

test("linter flags the expensive omissions on a bare large order", () => {
  const d = structuredClone(MINIMAL);
  d.data.quantity.value = 100000;
  const warnings = lint(d);
  const text = warnings.join(" | ");
  for (const needle of ["environment", "licensing", "acceptance", "diversity"]) {
    assert.ok(text.includes(needle), `expected a warning about ${needle}`);
  }
});

test("linter is quiet where it should be", () => {
  const doc = loadDocument(join(EXAMPLES, "humanoid-warehouse.yaml"));
  const warnings = lint(doc, { now: new Date("2026-08-20") });
  assert.deepEqual(warnings, [], `flagship example should lint clean, got:\n  ${warnings.join("\n  ")}`);
});

test("linter catches sensors/modalities inconsistency", () => {
  const d = structuredClone(MINIMAL);
  d.modalities = ["rgb"];
  d.capture = { sensors: [{ modality: "depth" }] };
  const warnings = lint(d);
  assert.ok(warnings.some((w) => w.includes("'depth'")), warnings.join("; "));
});

// ------------------------------------------------------------------- ids

test("generated ids match the schema pattern", () => {
  for (let i = 0; i < 200; i++) {
    const id = requestId();
    assert.match(id, ID_PATTERN, `bad id: ${id}`);
  }
});

test("generated ids validate in a document", () => {
  const d = structuredClone(MINIMAL);
  d.id = requestId();
  assert.ok(validateRequest(d).valid);
});

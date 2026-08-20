#!/usr/bin/env node
// ODRS reference CLI.
//
//   odrs validate <file> [--json] [--strict]
//   odrs render   <file>
//   odrs inspect  <file>
//   odrs init     [file]
//   odrs version

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateDocument } from "../src/validate.mjs";
import { renderDocument, inspectRequest } from "../src/render.mjs";
import { loadDocument } from "../src/load.mjs";
import { requestId } from "../src/ulid.mjs";

const OK = "✓";   // ✓
const WARN = "⚠"; // ⚠
const ERR = "✗";  // ✗

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const [command, file] = positional;

function usage(code = 1) {
  console.log(`ODRS — Open Data Request Specification

Usage:
  odrs validate <file> [--json] [--strict]   Validate a data request (YAML or JSON)
  odrs render   <file>                       Human-readable summary
  odrs inspect  <file>                       Machine-readable structural summary
  odrs init     [file]                       Write a starter request (default: data-request.yaml)
  odrs version                               Print CLI and spec versions

--json     machine-readable validation output
--strict   exit non-zero on warnings, not only errors`);
  process.exit(code);
}

function load(path) {
  if (!path) usage();
  try {
    return loadDocument(path);
  } catch (e) {
    console.error(`${ERR} cannot read ${path}: ${e.message}`);
    process.exit(1);
  }
}

switch (command) {
  case "validate": {
    const doc = load(file);
    const result = validateDocument(doc);

    if (flags.has("--json")) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.valid && !(flags.has("--strict") && result.warnings.length) ? 0 : 1);
    }

    if (result.valid) {
      const label = (result.objectType ?? "document").replace("_", " ");
      console.log(`${OK} Valid ODRS v${doc.odrs_version} ${label}`);
      const parts = [];
      if (doc.id) parts.push(`id ${doc.id}`);
      if (doc.title) parts.push(doc.title);
      if (parts.length) console.log(`  ${parts.join(" — ")}`);
      for (const w of result.warnings) console.log(`${WARN} ${w}`);
      if (result.warnings.length)
        console.log(`\n${result.warnings.length} warning(s). Warnings do not make the document invalid; they mark omissions that historically cause disputes.`);
      process.exit(flags.has("--strict") && result.warnings.length ? 1 : 0);
    } else {
      console.log(`${ERR} Invalid ODRS document — ${result.errors.length} error(s):\n`);
      for (const e of result.errors) console.log(`${ERR} ${e}`);
      process.exit(1);
    }
    break;
  }

  case "render": {
    const doc = load(file);
    const result = validateDocument(doc);
    if (!result.valid) {
      console.error(`${ERR} refusing to render an invalid document; run 'odrs validate ${file}' first`);
      process.exit(1);
    }
    console.log(renderDocument(doc));
    break;
  }

  case "inspect": {
    const doc = load(file);
    console.log(JSON.stringify(inspectRequest(doc), null, 2));
    break;
  }

  case "init": {
    const target = file ?? "data-request.yaml";
    if (existsSync(target)) {
      console.error(`${ERR} ${target} already exists; refusing to overwrite`);
      process.exit(1);
    }
    const id = requestId();
    writeFileSync(target, starter(id), "utf8");
    console.log(`${OK} wrote ${target} (id ${id})`);
    console.log(`  edit it, then run: odrs validate ${target}`);
    break;
  }

  case "version": {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")
    );
    console.log(`@odrs/core ${pkg.version} — implements ODRS v0.1 + v0.2`);
    break;
  }

  default:
    usage(command ? 1 : 0);
}

function starter(id) {
  return `# ODRS data request — edit the TODOs, then run: odrs validate <this file>
# Field reference: spec/v0.1/specification.md

odrs_version: "0.1"
type: data_request
id: ${id}

title: TODO short human-readable title

task:
  category: manipulation        # see specification for the vocabulary
  type: TODO_finer_grained_task
  includes_failures: false

# Omit embodiment entirely for human/egocentric capture with no robot,
# or set type: human.
embodiment:
  type: humanoid

environment:
  type: warehouse
  realism: staged_real          # in_the_wild | staged_real | lab_mockup | simulation

data:
  quantity:
    value: 1000
    unit: episode               # episode | demonstration | hour | frame | scene | interaction | sample
  episode_duration_seconds:
    typical: 20

modalities: [rgb, depth, joint_state, action]

capture:
  method: teleoperation
  action_space:
    representation: joint_position
    reference_frame: robot_base
    control_frequency_hz: 30

diversity:
  distinct_environments: { minimum: 3 }
  distinct_objects: { minimum: 50 }

geography:
  collection: [IN]
  usage: [US]

acceptance:
  sample:
    quantity: { value: 50, unit: episode }
    paid: true
    evaluation: manual_review
  criteria:
    - metric: sync_error_ms
      operator: lte
      value: 10
      unit: ms
      measurement: >
        TODO: state who or what measures this, against what definition,
        over what population. A threshold without a measurement method
        is a wish, not a requirement.

licensing:
  commercial_training: true
  commercial_deployment: true
  exclusive: false

delivery:
  deadline: "2027-01-01"
  format: { standard: lerobot }

economics:
  pricing_model: price_discovery   # or fixed_budget with a budget block

publication:
  visibility: public               # public | anonymous | private
  status: draft
  contact: { method: email, value: TODO@example.com }
`;
}

// Document loading. YAML 1.2 is a superset of JSON, so one parser covers
// both .yaml and .json inputs; JSON remains the canonical machine
// representation per the specification.

import { readFileSync } from "node:fs";
import { parse } from "yaml";

export function loadDocument(path) {
  let text = readFileSync(path, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  return parse(text);
}

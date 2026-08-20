// Human-readable rendering of an ODRS data request.
// ODRS documents must be understandable by people, not only machines; this
// renderer is the reference for what "understandable" means.

const n = (v) => (typeof v === "number" ? v.toLocaleString("en-US") : v);

function line(label, value) {
  if (value === undefined || value === null || value === "") return null;
  return `${label.padEnd(13)}${value}`;
}

function taskLine(t) {
  if (!t) return null;
  let s = t.category ?? "";
  if (t.type) s += ` / ${t.type}`;
  if (t.includes_failures) s += "  (failure cases wanted)";
  return s;
}

function embodimentLine(e) {
  if (!e) return null;
  let s = e.type ?? "unspecified";
  const extra = [];
  if (e.hands != null) extra.push(`${e.hands} hands`);
  if (e.platform) extra.push(e.platform);
  if (e.alternatives?.length) extra.push(`alt: ${e.alternatives.join(", ")}`);
  return extra.length ? `${s}  (${extra.join(" · ")})` : s;
}

function quantityLine(d) {
  const q = d?.quantity;
  if (!q) return null;
  let s = `${n(q.value)} ${q.unit}${q.value === 1 ? "" : "s"}`;
  const extra = [];
  if (q.minimum != null) extra.push(`min ${n(q.minimum)}`);
  const dur = d.episode_duration_seconds;
  if (dur?.typical != null) extra.push(`~${dur.typical}s each`);
  return extra.length ? `${s}  (${extra.join(", ")})` : s;
}

function captureLine(c) {
  if (!c) return null;
  const parts = [];
  if (c.method) parts.push(c.method);
  const a = c.action_space;
  if (a?.representation) {
    let s = a.representation;
    if (a.control_frequency_hz) s += ` @ ${a.control_frequency_hz}Hz`;
    parts.push(s);
  }
  if (c.sensors?.length) parts.push(`${c.sensors.length} sensor spec(s)`);
  if (c.synchronization?.maximum_error_ms != null)
    parts.push(`sync ≤ ${c.synchronization.maximum_error_ms}ms`);
  return parts.length ? parts.join(" · ") : null;
}

function diversityLine(d) {
  if (!d) return null;
  const parts = [];
  const named = {
    distinct_environments: "environments",
    distinct_scenes: "scenes",
    distinct_objects: "objects",
    distinct_operators: "operators",
    distinct_embodiment_instances: "robots",
    lighting_conditions: "lighting conditions",
  };
  for (const [k, label] of Object.entries(named)) {
    if (d[k]?.minimum != null) parts.push(`≥${n(d[k].minimum)} ${label}`);
  }
  if (d.maximum_share_per_environment != null)
    parts.push(`≤${Math.round(d.maximum_share_per_environment * 100)}% from any one environment`);
  return parts.length ? parts.join(" · ") : null;
}

function geographyLine(g) {
  if (!g) return null;
  const parts = [];
  if (g.collection?.length) parts.push(`collect: ${g.collection.join(", ")}`);
  if (g.collection_excluded?.length) parts.push(`excluded: ${g.collection_excluded.join(", ")}`);
  if (g.usage?.length) parts.push(`use: ${g.usage.join(", ")}`);
  return parts.length ? parts.join("  →  ") : null;
}

function acceptanceLine(a) {
  if (!a) return null;
  const parts = [];
  if (a.sample?.quantity)
    parts.push(`sample ${n(a.sample.quantity.value)} ${a.sample.quantity.unit}s${a.sample.paid ? " (paid)" : ""}`);
  if (a.criteria?.length) {
    const blocking = a.criteria.filter((c) => c.blocking !== false).length;
    parts.push(`${a.criteria.length} criteria (${blocking} blocking)`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function licensingLine(l) {
  if (!l) return null;
  const rights = [];
  if (l.commercial_training) rights.push("commercial training");
  if (l.commercial_deployment) rights.push("deployment");
  if (l.research && !l.commercial_training) rights.push("research only");
  if (l.derivative_models) rights.push("derivative models");
  let s = rights.join(" + ") || "see request";
  s += l.exclusive ? " · EXCLUSIVE" : " · non-exclusive";
  if (l.provenance_documentation_required) s += " · provenance docs required";
  if (l.consent_artifacts_required) s += " · consent artifacts required";
  return s;
}

function deliveryLine(d) {
  if (!d) return null;
  const parts = [];
  if (d.deadline) parts.push(d.deadline);
  if (d.format?.standard && d.format.standard !== "unspecified")
    parts.push(d.format.version ? `${d.format.standard} ${d.format.version}` : d.format.standard);
  if (d.transfer) parts.push(d.transfer);
  if (d.milestones?.length) parts.push(`${d.milestones.length} milestones`);
  return parts.length ? parts.join(" · ") : null;
}

function budgetLine(e) {
  if (!e) return null;
  const b = e.budget;
  if (!b) return e.pricing_model ? e.pricing_model.replace("_", " ") : null;
  const cur = b.currency ?? "";
  let range;
  if (b.min != null && b.max != null) range = `${n(b.min)}–${n(b.max)}`;
  else range = n(b.min ?? b.max);
  let s = `${cur} ${range}`.trim();
  if (b.basis) s += b.basis === "per_unit" ? `  (per ${b.unit ?? "unit"})` : "  (total)";
  return s;
}

function contactLine(p) {
  const c = p?.contact;
  if (!c || c.method === "none") return null;
  return c.value ? `${c.method}: ${c.value}` : c.method;
}

export function renderRequest(doc) {
  const rule = "─".repeat(64);
  const status = doc.publication?.status ? `  [${doc.publication.status.toUpperCase()}]` : "";
  const idPart = doc.id ?? "(unpublished draft)";

  const rows = [
    line("Task", taskLine(doc.task)),
    line("Embodiment", embodimentLine(doc.embodiment)),
    line("Environment", doc.environment ? [doc.environment.type, doc.environment.realism].filter(Boolean).join(" · ") : null),
    line("Quantity", quantityLine(doc.data)),
    line("Modalities", doc.modalities?.join(" · ")),
    line("Capture", captureLine(doc.capture)),
    line("Diversity", diversityLine(doc.diversity)),
    line("Geography", geographyLine(doc.geography)),
    line("Acceptance", acceptanceLine(doc.acceptance)),
    line("Licensing", licensingLine(doc.licensing)),
    line("Delivery", deliveryLine(doc.delivery)),
    line("Budget", budgetLine(doc.economics)),
    line("Publisher", doc.publication?.publisher?.name ?? (doc.publication?.visibility === "anonymous" ? "(anonymous)" : undefined)),
    line("Contact", contactLine(doc.publication)),
  ].filter(Boolean);

  const out = [
    rule,
    `ODRS DATA REQUEST  ${idPart}${status}`,
    ...(doc.title ? [doc.title] : []),
    rule,
    ...rows,
    rule,
    `odrs_version ${doc.odrs_version}`,
  ];
  return out.join("\n");
}

/** Machine-readable structural summary (odrs inspect). */
export function inspectRequest(doc) {
  return {
    odrs_version: doc.odrs_version,
    id: doc.id ?? null,
    title: doc.title ?? null,
    task: doc.task?.category ?? null,
    task_type: doc.task?.type ?? null,
    embodiment: doc.embodiment?.type ?? null,
    environment: doc.environment?.type ?? null,
    realism: doc.environment?.realism ?? null,
    quantity: doc.data?.quantity ?? null,
    modalities: doc.modalities ?? [],
    capture_method: doc.capture?.method ?? null,
    action_representation: doc.capture?.action_space?.representation ?? null,
    sensor_specs: doc.capture?.sensors?.length ?? 0,
    diversity_constraints: doc.diversity ? Object.keys(doc.diversity).filter((k) => k !== "notes").length : 0,
    collection_countries: doc.geography?.collection ?? [],
    usage_countries: doc.geography?.usage ?? [],
    acceptance_criteria: doc.acceptance?.criteria?.length ?? 0,
    blocking_criteria: doc.acceptance?.criteria?.filter((c) => c.blocking !== false).length ?? 0,
    sample_gated: Boolean(doc.acceptance?.sample),
    commercial_training: doc.licensing?.commercial_training ?? null,
    exclusive: doc.licensing?.exclusive ?? null,
    deadline: doc.delivery?.deadline ?? null,
    delivery_format: doc.delivery?.format?.standard ?? null,
    budget: doc.economics?.budget
      ? {
          min: doc.economics.budget.min ?? null,
          max: doc.economics.budget.max ?? null,
          currency: doc.economics.budget.currency ?? null,
          basis: doc.economics.budget.basis ?? null,
        }
      : null,
    visibility: doc.publication?.visibility ?? null,
    status: doc.publication?.status ?? null,
    extensions: doc.extensions ? Object.keys(doc.extensions) : [],
  };
}

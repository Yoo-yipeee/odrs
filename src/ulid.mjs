// Crockford-base32 ULID, dependency-free.
// ODRS ids are "dr_" + ULID (26 chars). See spec/v0.1/specification.md §3.
//
// Privacy note: the first 10 characters encode the creation timestamp. For
// anonymous requests where drafting time must not leak, callers may pass a
// coarsened timestamp (e.g. midnight UTC of the publication day).

import { randomBytes } from "node:crypto";

const CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford: no I, L, O, U

export function ulid(timestamp = Date.now()) {
  let t = timestamp;
  let time = "";
  for (let i = 0; i < 10; i++) {
    time = CHARS[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const rand = randomBytes(16);
  let entropy = "";
  for (let i = 0; i < 16; i++) entropy += CHARS[rand[i] % 32];
  return time + entropy;
}

export function requestId(timestamp) {
  return `dr_${ulid(timestamp)}`;
}

export const OBJECT_PREFIXES = { data_request: "dr", capability: "cap", offer: "off", dataset: "dat", attestation: "att" };

/** Mint an id for any ODRS object type ("data_request", "capability", ...). */
export function objectId(objectType, timestamp) {
  const prefix = OBJECT_PREFIXES[objectType];
  if (!prefix) throw new Error(`unknown ODRS object type: ${objectType}`);
  return `${prefix}_${ulid(timestamp)}`;
}

export const ID_PATTERN = /^dr_[0-9A-HJKMNP-TV-Z]{26}$/;
export const ANY_ID_PATTERN = /^(dr|cap|off|dat|att)_[0-9A-HJKMNP-TV-Z]{26}$/;

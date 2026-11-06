import { test } from "node:test";
import assert from "node:assert/strict";
import { blobKey, parsePicks } from "./lib.mjs";

test("blobKey is stable per content and namespaced", () => {
  const a = blobKey("2024-mission-fair", Buffer.from("abc"));
  assert.match(a, /^wall-of-faith\/2024-mission-fair-[0-9a-f]{8}\.jpg$/);
  assert.equal(a, blobKey("2024-mission-fair", Buffer.from("abc")));
  assert.notEqual(a, blobKey("2024-mission-fair", Buffer.from("abd")));
});

test("parsePicks validates shape", () => {
  assert.deepEqual(parsePicks('{"2024-mission-fair":"/x/a.jpg"}'), { "2024-mission-fair": "/x/a.jpg" });
  assert.throws(() => parsePicks("[]"));
  assert.throws(() => parsePicks("null"));
  assert.throws(() => parsePicks('{"Bad Slug":"/x"}'));
  assert.throws(() => parsePicks('{"ok":3}'));
});

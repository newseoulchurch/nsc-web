import { test } from "node:test";
import assert from "node:assert/strict";
import { sqlLiteral, buildMigration } from "./build-migration.ts";
import { seedYears, seedEvents, OVERRIDES } from "./seed.ts";
import { wallOfFaithEvents } from "../../src/data/wall-of-faith.ts";
import { eventInputSchema } from "../../src/lib/wall-of-faith/model.ts";

test("sqlLiteral escapes and types values", () => {
  assert.equal(sqlLiteral("God’s 'grace'"), "'God’s ''grace'''");
  assert.equal(sqlLiteral(null), "null");
  assert.equal(sqlLiteral(true), "true");
  assert.equal(sqlLiteral(2024), "2024");
});

test("every current event has an override, and no override is orphaned", () => {
  const keys = new Set(wallOfFaithEvents.map((e) => `${e.year}|${e.title}|${e.date}`));
  for (const k of Object.keys(OVERRIDES)) assert.ok(keys.has(k), `orphan override ${k}`);
  assert.equal(keys.size, Object.keys(OVERRIDES).length);
});

test("seed events are valid, slugs unique, years exist", () => {
  const years = new Set(seedYears.map((y) => y.year));
  const slugs = new Set<string>();
  for (const e of seedEvents()) {
    eventInputSchema.parse(e);
    assert.ok(!slugs.has(e.slug), `duplicate slug ${e.slug}`);
    slugs.add(e.slug);
    assert.ok(years.has(e.year), `no year row for ${e.year}`);
  }
});

test("corrections from Margot and Drive are applied", () => {
  const find = (t: string, y: number) => seedEvents().find((e) => e.title === t && e.year === y)!;
  assert.equal(find("NSK VBS (Vacation Bible School)", 2025).sortDate, "2025-08-09");
  assert.equal(find("NSK VBS (Vacation Bible School)", 2025).dateLabel, "Aug 9–10, 2025");
  assert.equal(find("Christmas", 2024).milestone, "Christmas play");
  assert.equal(find("Christmas", 2025).milestone, "Christmas film");
  assert.equal(find("Sports Monster 1st Bungae (번개) Fellowship", 2024).sortDate, "2024-05-15");
  assert.equal(find("New Glow", 2024).needsReview, true);
  assert.equal(find("Good Friday Service", 2024).needsReview, false);
  assert.ok(seedEvents().filter((e) => e.year === 2026).every((e) => e.needsReview));
});

test("buildMigration creates both tables, enables RLS, inserts every row", () => {
  const sql = buildMigration(seedYears, seedEvents());
  assert.match(sql, /create table wall_of_faith_years/);
  assert.match(sql, /create table wall_of_faith_events/);
  assert.match(sql, /alter table wall_of_faith_events enable row level security/);
  assert.match(sql, /alter table wall_of_faith_years enable row level security/);
  const eventRows = (sql.match(/^ {2}\('/gm) ?? []).length;
  const yearRows = (sql.match(/^ {2}\(\d{4}, '/gm) ?? []).length;
  assert.equal(eventRows, seedEvents().length);
  assert.equal(yearRows, seedYears.length);
});

test("every insert line has balanced quotes after escaping (NSC's, God's)", () => {
  const sql = buildMigration(seedYears, [...seedEvents(), { ...seedEvents()[0], slug: "x-quote", description: "NSC's 'test'" }]);
  for (const line of sql.split("\n").filter((l) => l.startsWith("  ("))) {
    const quotes = (line.replace(/''/g, "").match(/'/g) ?? []).length;
    assert.equal(quotes % 2, 0, line.slice(0, 80));
  }
});

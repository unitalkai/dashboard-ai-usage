import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categories,
  daily,
  defaultFilters,
  DEMO_DATE,
  events,
  filterEvents,
  rank,
  searchEvents,
  shiftDate,
  summarize,
  toCsv,
  type UsageEvent,
} from "../src/lib/usage";

test("deterministic demo events cover exactly 60 days with unique IDs", () => {
  assert.equal(new Set(events.map((e) => e.date)).size, 60);
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
  assert.equal(events.at(-1)?.date, DEMO_DATE);
  assert.ok(
    events.every(
      (e) => e.credits > 0 && Math.abs(e.costUsd - e.credits * 0.001) < 1e-10,
    ),
  );
});
test("periods have exact inclusive boundaries and do not overlap", () => {
  for (const days of [7, 30] as const) {
    const f = { ...defaultFilters, days },
      current = filterEvents(events, f),
      previous = filterEvents(events, f, true);
    assert.equal(new Set(current.map((e) => e.date)).size, days);
    assert.equal(current[0].date, shiftDate(DEMO_DATE, 1 - days));
    assert.equal(previous.at(-1)?.date, shiftDate(DEMO_DATE, -days));
    assert.ok(current.every((e) => !previous.some((p) => p.id === e.id)));
  }
});
test("all entity filters intersect and unknown entity gives an empty result", () => {
  const e = events.at(-1)!;
  const selected = filterEvents(events, {
    days: 7,
    user: e.user,
    collaborator: e.collaborator,
    profile: e.profile,
  });
  assert.ok(selected.length > 0);
  assert.ok(
    selected.every(
      (v) =>
        v.user === e.user &&
        v.collaborator === e.collaborator &&
        v.profile === e.profile,
    ),
  );
  assert.deepEqual(
    filterEvents(events, { ...defaultFilters, user: "missing" }),
    [],
  );
});
test("summary, daily points, categories and rankings reconcile", () => {
  const selected = filterEvents(events, defaultFilters),
    summary = summarize(selected),
    points = daily(selected, 30);
  assert.equal(
    points.reduce((n, d) => n + d.credits, 0),
    summary.credits,
  );
  assert.equal(
    points.reduce((n, d) => n + d.calls, 0),
    selected.length,
  );
  assert.equal(
    points.reduce((n, d) => n + d.categories.reduce((a, b) => a + b, 0), 0),
    summary.credits,
  );
  for (const field of ["model", "collaborator", "profile"] as const) {
    const ranking = rank(selected, field);
    assert.equal(
      ranking.reduce((n, r) => n + r.credits, 0),
      summary.credits,
    );
    assert.equal(
      ranking.reduce((n, r) => n + r.calls, 0),
      selected.length,
    );
    assert.ok(
      ranking.every((r, i) => i === 0 || r.credits <= ranking[i - 1].credits),
    );
  }
  assert.equal(categories.length, 6);
});
test("unique chats/users are distinct and empty data is safe", () => {
  const e = events[0];
  assert.equal(summarize([e, { ...e, id: "other" }]).chats, 1);
  assert.equal(summarize([e, { ...e, id: "other" }]).users, 1);
  assert.deepEqual(summarize([]), {
    users: 0,
    collaborators: 0,
    credits: 0,
    costUsd: 0,
    chats: 0,
    scheduledTasks: 0,
    calls: 0,
  });
  assert.ok(daily([], 7).every((d) => d.credits === 0));
});
test("search is accent/case insensitive and matches CSV dataset", () => {
  const selected = filterEvents(events, defaultFilters);
  const result = searchEvents(selected, "REDACTION");
  assert.ok(result.length > 0);
  assert.ok(result.every((e) => e.collaborator === "Assistant rédaction"));
  const csv = toCsv(result);
  assert.equal(csv.split("\r\n").length, result.length + 1);
  assert.ok(csv.startsWith("\uFEFFID;Date;"));
  assert.ok(csv.includes('"Assistant rédaction"'));
  assert.equal(searchEvents(selected, "impossible-query").length, 0);
});
test("CSV escapes quotes, semicolons and formula injection, preserves independent field", () => {
  const e: UsageEvent = { ...events[0], user: '=SUM(1;2)"', costUsd: 1.2345 };
  const csv = toCsv([e]);
  assert.ok(csv.includes('"\'=SUM(1;2)"""'));
  assert.ok(csv.includes('"1.2345"'));
  assert.equal(toCsv([]).split("\r\n").length, 1);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { keysFromOsmName, parseCrashAddress } from "../src/streetkeys.ts";

test("X separates numbered roads instead of becoming a detached street suffix", () => {
  for (const [address, a, b] of [
    ["CARRERA 44 X CALLE 84", "CR44", "CL84"],
    ["KR 17 X CL 71", "CR17", "CL71"],
    ["TV 27 X CL 57", "TV27", "CL57"],
    ["CL 71 X KR 17", "CL71", "CR17"],
    ["KR 17 B X CL 71", "CR17B", "CL71"],
    ["KR 17 X AVENIDA CALLE 71", "CR17", "CL71"],
  ] as const) {
    assert.deepEqual(parseCrashAddress(address), { kind: "junction", a, b }, address);
  }
});

test("X also separates roads already recognised by the named-road parser", () => {
  for (const [address, a, b] of [
    ["KR 17 X AV MURILLO", "CR17", "CL45"],
    ["CL 71 X VIA 40", "CL71", "VIA40"],
    ["KR 17 X CIRCUNVALAR", "CR17", "CIRCUNVALAR"],
  ] as const) {
    assert.deepEqual(parseCrashAddress(address), { kind: "junction", a, b }, address);
  }
});

test("real X suffixes remain part of street names and addresses", () => {
  assert.deepEqual(keysFromOsmName("Carrera 17X"), ["CR17X"]);
  assert.deepEqual(keysFromOsmName("Carrera 17 X"), ["CR17X"]);
  for (const address of ["KR 17X CON CL 71", "KR 17 X CON CL 71", "KR 17X X CL 71"]) {
    assert.deepEqual(parseCrashAddress(address), { kind: "junction", a: "CR17X", b: "CL71" }, address);
  }
  assert.deepEqual(parseCrashAddress("KR 17 X"), { kind: "single", a: "CR17X" });
  assert.deepEqual(parseCrashAddress("KR 17 X 24"), { kind: "door", a: "CR17X" });
});

test("X does not turn incomplete, door or between-street addresses into junctions", () => {
  assert.notEqual(parseCrashAddress("KR 17 X CL").kind, "junction");
  assert.equal(parseCrashAddress("KR 17 X CL 71 24").kind, "door");
  assert.equal(parseCrashAddress("KR 17 X CL 71 Y 72").kind, "between");
  assert.notEqual(parseCrashAddress("KR 17 X KR 17").kind, "junction");
});

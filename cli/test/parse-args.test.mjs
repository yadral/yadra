import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/util/parse-args.mjs";
import {
  parseFeatureYadraContent,
  primaryDeliverablePath,
  hasDeliverableOutputPaths,
} from "../src/util/feature-yadra.mjs";

test("parseArgs reads separated and inline values", () => {
  const parsed = parseArgs([
    "set",
    "--profile",
    "dev",
    "--provider=openai",
    "--include",
    "a.ksl,b.ksl",
    "--kinds",
    "code,data",
  ]);

  assert.equal(parsed.error, null);
  assert.deepEqual(parsed.positional, ["set"]);
  assert.equal(parsed.flags.profile, "dev");
  assert.equal(parsed.flags.provider, "openai");
  assert.deepEqual(parsed.flags.include, ["a.ksl", "b.ksl"]);
  assert.deepEqual(parsed.flags.kinds, ["code", "data"]);
});

test("parseArgs maps -v to verbose", () => {
  const parsed = parseArgs(["-v", "--step", "t1"]);
  assert.equal(parsed.error, null);
  assert.equal(parsed.flags.verbose, true);
  assert.equal(parsed.provided.has("--verbose"), true);
  assert.equal(parsed.provided.has("-v"), false);
});

test("parseArgs reads make flags", () => {
  const parsed = parseArgs([
    "--step",
    "t2",
    "--no-gate",
    "--no-combined",
    "--merge",
    "--combined",
  ]);
  assert.equal(parsed.error, null);
  assert.equal(parsed.flags.step, "t2");
  assert.equal(parsed.flags.noGate, true);
  assert.equal(parsed.flags.noCombined, true);
  assert.equal(parsed.flags.merge, true);
  assert.equal(parsed.flags.combined, true);
});

test("parseArgs rejects missing option values", () => {
  assert.equal(
    parseArgs(["set", "--profile"]).error,
    "Missing value for --profile",
  );
  assert.equal(
    parseArgs(["--model", "--seal"]).error,
    "Missing value for --model",
  );
});

test("feature parser only reads children of output_paths", () => {
  const parsed = parseFeatureYadraContent(`
kind: KSL
output_paths:
  module: "services/members/members.module.ksl"
  spec: services/members/create.spec.ksl # generated spec

other:
  spec: must-not-be-read.spec.ksl
`);

  assert.deepEqual(parsed.outputPaths, {
    module: "services/members/members.module.ksl",
    spec: "services/members/create.spec.ksl",
  });
});

test("primaryDeliverablePath accepts root, module, or spec alone", () => {
  assert.equal(
    primaryDeliverablePath({ root: "root.project.ksl" }),
    "root.project.ksl",
  );
  assert.equal(
    primaryDeliverablePath({ module: "momo-cm.module.ksl" }),
    "momo-cm.module.ksl",
  );
  assert.equal(
    primaryDeliverablePath({ spec: "foo.spec.ksl" }),
    "foo.spec.ksl",
  );
  assert.equal(
    primaryDeliverablePath({ spec: "a.spec.ksl", root: "root.project.ksl" }),
    "a.spec.ksl",
  );
  assert.equal(hasDeliverableOutputPaths({}), false);
  assert.equal(hasDeliverableOutputPaths({ root: "r.ksl" }), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/util/parse-args.mjs";
import { parseFeatureYadraContent } from "../src/util/feature-yadra.mjs";

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

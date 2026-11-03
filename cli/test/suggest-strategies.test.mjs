import assert from "node:assert/strict";
import test from "node:test";
import {
  inferOutputKinds,
  suggestStrategiesFromCatalog,
} from "../vendor/yadral-dist/ksl/tools/yadra/lib/suggest-strategies.mjs";
import { extractCompactKsl } from "../src/runtime/formalize/build-comprendre-prompt.mjs";

test("inferOutputKinds defaults to code", () => {
  assert.deepEqual(inferOutputKinds("feature checkout"), ["code"]);
});

test("suggestStrategiesFromCatalog matches signals and kinds", () => {
  const strategies = [
    {
      id: "hexagonal",
      name: "Hexagonal",
      when: { outputs_kinds_any: ["code"] },
    },
    {
      id: "graphql-stream",
      name: "GraphQLStream",
      when: { outputs_kinds_any: ["code"], signals_any: ["graphql"] },
    },
  ];
  const allCode = suggestStrategiesFromCatalog(strategies, {
    corpus: "outputs kinds code only",
    kinds: ["code"],
  });
  assert.equal(allCode.length, 1);
  assert.equal(allCode[0].name, "Hexagonal");

  const gql = suggestStrategiesFromCatalog(strategies, {
    corpus: "graphql subscription api",
    kinds: ["code"],
  });
  assert.equal(gql.length, 2);
});

test("extractCompactKsl accepts fenced block", () => {
  const text = "Here:\n```compact.ksl\n# deliverables\nksl_levels: [spec]\n```";
  assert.match(extractCompactKsl(text), /^# deliverables/);
});

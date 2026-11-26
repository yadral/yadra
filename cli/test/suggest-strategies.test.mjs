import assert from "node:assert/strict";
import test from "node:test";
import {
  inferOutputKinds,
  suggestStrategiesFromCatalog,
} from "../vendor/yadral-dist/ksl/tools/yadra/lib/suggest-strategies.mjs";
import { extractCompactKsl } from "../src/runtime/formalize/build-comprendre-prompt.mjs";
import { extractMarkedFiles } from "../src/runtime/formalize/parse-llm-files.mjs";

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

test("extractCompactKsl skips prose before deliverables", () => {
  const text =
    "Voici l'analyse.\n\n# deliverables\nksl_levels: [spec]\n";
  assert.match(extractCompactKsl(text), /^# deliverables/);
});

test("extractMarkedFiles drops kotlin fences and trailing commentary", () => {
  const text = [
    "--- FILE: src/Builder.kt ---",
    "```kotlin",
    "class Builder { fun build(): String = \"ok\" }",
    "```",
    "Après remplacement : lance mvn test.",
  ].join("\n");
  const files = extractMarkedFiles(text);
  assert.equal(files.length, 1);
  assert.equal(files[0].content, 'class Builder { fun build(): String = "ok" }');
});

test("extractMarkedFiles drops an Ask-mode note after Kotlin", () => {
  const text = [
    "--- FILE: src/test/Tester.kt ---",
    "class Tester {",
    "    fun ok() = true",
    "}",
    "*(Mode Ask : ces blocs ne sont pas appliqués automatiquement — passe en mode Agent pour les écrire, ou colle-les toi-même puis relance `mvn test`.)*",
  ].join("\n");
  const files = extractMarkedFiles(text);
  assert.equal(files[0].content, "class Tester {\n    fun ok() = true\n}");
});

test("extractMarkedFiles drops prose glued after a Kotlin declaration", () => {
  const text = [
    "--- FILE: src/main/java/com/iyadris/paymentsservice/domain/converter/EntityDependencyResolver.kt ---",
    "package com.iyadris.paymentsservice.domain.converter",
    "",
    "fun interface EntityDependencyResolver<S> {",
    "    fun resolve(source: S): MappingContext",
    "} Après remplacement : ce fichier doit compiler sans phrase ajoutée par le modèle.",
  ].join("\n");
  const files = extractMarkedFiles(text);
  assert.equal(
    files[0].content,
    [
      "package com.iyadris.paymentsservice.domain.converter",
      "",
      "fun interface EntityDependencyResolver<S> {",
      "    fun resolve(source: S): MappingContext",
      "}",
    ].join("\n"),
  );
});

/** KSL runtime embarqué dans vendor/ (tarball) ou lien monorepo (prepare). */
export {
  findRootProjectInDir,
  resolveCommandPath,
  validateAndBuildContext,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/context.mjs";
export {
  grammarPath,
  readGrammarVersion,
  resolveKslHome,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/ksl-home.mjs";
export {
  resolveSpecPath,
  specIdFromPath,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/paths.mjs";
export {
  applyBindingTemplate,
  findServiceProjectNearSpec,
  packagePathToFileRel,
  resolveT2Bindings,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/t2-bindings.mjs";
export {
  assertManifestCoverage,
  buildFileManifest,
  manifestForStrategy,
  parseSkeletonParticipants,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/skeleton-manifest.mjs";
export { runValidate } from "../../vendor/yadral-dist/ksl/tools/yadra/lib/validate.mjs";
export { runSeal } from "../../vendor/yadral-dist/ksl/tools/yadra/lib/seal.mjs";
export {
  buildPlan,
  formatPlanHuman,
  runPlan,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/plan.mjs";
export { resolveOutputRouting } from "../../vendor/yadral-dist/ksl/tools/yadra/lib/output-phase.mjs";
export { extractSpecMeta } from "../../vendor/yadral-dist/ksl/tools/yadra/lib/spec-extract.mjs";
export {
  runStrategiesList,
  runStrategiesShow,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/strategies.mjs";
export {
  loadStrategyCatalog,
  parseStrategyCatalog,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/catalog.mjs";
export {
  inferOutputKinds,
  suggestStrategiesFromCatalog,
  formatStrategyCandidates,
} from "../../vendor/yadral-dist/ksl/tools/yadra/lib/suggest-strategies.mjs";

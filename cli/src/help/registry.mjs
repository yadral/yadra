import { readCliVersion } from "../config/manifest.mjs";

export function globalHelp() {
  const v = readCliVersion();
  return `Yadra CLI v${v} — Ingénierie formelle KSL

Usage:
  yadra <commande> [options]

CLI — Transversal:
  version      Affiche la version CLI (yadra/manifest.mf) et le projet actif
  help         Aide globale ou yadra <commande> -h
  configure    Profils LLM et credentials (~/.config/yadra/)
  project      Enregistre et active les projets (KSL + code)
  doctor       Diagnostic environnement

Timeline 1 (T1):
  formalize    T1 · A→B→C : LLM si KSL manquants ; sinon validate + seal
  validate     Validation KSL L0–L3
  seal         Scellement T1 (.yadra/sealed/)

Timeline 2 (T2):
  plan         Plan de compilation depuis une spec (.spec.ksl) — T2 · A
  execute      Matérialisation sous PROJECT_HOME — T2 · B
  gate         Conformance Gate — T2 · C · LIVRER (phase.gate)
  strategies   Catalogue (list / show / explain)

Règle (T1/T2 sauf validate) : LLM yadra configure + SKILL + plan validate (fallback draft v1).
  --skip-llm   Désactive l'agent (extract regex / validate-seal seul).

Exécutez "yadra <commande> -h" pour le détail.`;
}

export function commandHelp(name) {
  const map = {
    version: `Usage: yadra version [--format human|json]

Affiche la version lue depuis yadra/manifest.mf, KSL_HOME, grammaire et projet actif.`,
    help: `Usage: yadra help [commande]
       yadra -h`,
    configure: `Usage:
  yadra configure list
  yadra configure set --profile <nom> [--provider <id>] [--model <id>] [--base-url <url>] [--timeout <ms>]
  yadra configure credentials --profile <nom> [--token <val>] [--username <u>] [--password <p>]
  yadra configure get <clé> [--profile <nom>]
  yadra configure test [--profile <nom>] [--model <id>] [--prompt <texte>] [--auth-only]

Stocke configure et credentials sous ~/.config/yadra/.

test : valide token (+ échange crsr_ pour cursor) et envoie un court appel au modèle configuré
  (profil du projet actif si --profile omis). --auth-only : credentials sans appel LLM.`,
    project: `yadra project — registre multi-projets (v0.1.1+)

Un projet = KSL_PROJECT_HOME (specs .ksl) + PROJECT_HOME (code généré).
Chemins persistés en absolu dans ~/.config/yadra/projects.json (champ "current").

Sous-commandes:
  list              Tableau name / KSL / PROJECT / * = courant
  add <name>        Enregistre un projet (--ksl-project-home requis)
  update <name>     Met à jour chemins et/ou LLM (profil seul : pas de re-scan KSL)
  set-profile [<name>] --profile <p> [--model <id>]
                    Profil yadra configure + modèle pour ce projet (<name> = courant si omis)
  use <name>        Active un projet (formalize / validate / seal / plan suivent ce couple)
  show [name]       Détail du projet courant ou nommé
  export            export shell: YADRA_PROJECT, KSL_PROJECT_HOME, PROJECT_HOME, …
  remove <name>     Retire du registre (interdit si projet courant)
  clear             current = null (entrées conservées)

Options (add / update):
  --ksl-project-home <path>   Root KSL (*.project.ksl kind = root) → absolu
  --project-home <path>       Dépôt applicatif → absolu
  --yadra-project-home <path> Distribution Yadra (souvent auto via paquet CLI)
  --profile <name>            Profil dans ~/.config/yadra/configure
  --model <id>                Modèle par défaut pour formalize (SKILLS A/B)
  --no-current                (add) n'active pas après création
  --allow-pending-ksl         (add/update) enregistre les chemins sans root.project.ksl (init)

Surcharge ponctuelle (formalize, validate, seal, plan):
  --project <name>            Projet enregistré sans changer "current"
  --ksl-project-home / --project-home / --profile / --model

Variables: YADRA_PROJECT=<name>  |  KSL_PROJECT_HOME / PROJECT_HOME (CI)

Exemple:
  yadra project add tontine --ksl-project-home ~/tontine-ksl --project-home ~/tontine-app
  yadra project add order --ksl-project-home ~/platform-ksl --project-home ~/order-app --no-current
  yadra project use order
  yadra project set-profile order --profile prod
  eval "$(yadra project export)"`,
    formalize: `Usage: yadra formalize <dossier-documents> [options]

T1 · une commande : A+B (LLM + SKILLS formalize si .ksl absents) puis C (validate + seal).
--skip-llm : branche A/B = plans/SKILLS seulement (pas de génération KSL).

Prérequis : yadra project use <name> (ou --project / --ksl-project-home)
Entrée obligatoire : <dossier-documents>/feature.yadra.md (au moins un output_paths : root, module ou spec).

Si des .ksl manquent (output_paths) : A+B in-process (LLM + SKILLS) puis enchaîne C si écriture OK.
Si --skip-llm et .ksl manquants : affiche plans/SKILLS, code 1.
Si tous les .ksl existent (et pas --force / --refresh / module stub) : validate (L0+L2+L3) puis seal (défaut).

Options:
  --seal / --no-seal   Scellement (défaut : --seal)
  --force              Toujours A+B puis C (régénère même si .ksl présents)
  --refresh            A+B si aucun sceau T1 sur le livrable principal
  --no-ensure-layout   Ne crée pas le sibling .module.ksl avant une spec
  --skip-llm           N'appelle pas le LLM ; affiche plans/SKILLS (comportement manuel)
  --syntax             L1 lors de validate/seal
  --include <paths>    Fichiers .ksl extra pour seal
  --project <name>     Projet enregistré (one-shot)
  --ksl-project-home, --project-home, --yadra-project-home
  --model, --profile   Modèle / profil pour A · COMPRENDRE`,
    validate: `Usage: yadra validate [PATH] [--syntax] [--layout] [--semantic] [--format human|json] [--project <name>] …`,
    seal: `Usage: yadra seal [PATH.ksl] [--syntax] [--include path,...] [--skip-llm] …

Livrable : .spec.ksl, .module.ksl ou .project.ksl (L2+L3 par défaut).
Charge SKILL formalize · C + plan validate avant scellement (--skip-llm : pas de bannière contexte).`,
    plan: `Usage: yadra plan [SPEC.spec.ksl | .] [--format human|json] [--kinds a,b] [--skip-llm] …

T2 · A · COMPRENDRE : LLM + SKILL execute/partie-a-comprendre + plan validate (ou draft v1).
--format human   Narratif agent + extrait regex MVP
--format json    Payload machine (sans appel LLM)
--skip-llm       Extract regex seul

Prérequis : yadra configure + credentials. validate/seal recommandés avant T2 réelle.`,
    execute: `Usage: yadra execute [SPEC.spec.ksl | .] [--kinds a,b] [--dry-run] [--allow-unsealed] [--skip-llm] [--no-verify] …

T2 · execute : LLM utilisateur (configure) + plan + SKILLS + strategy.ksl → code sous PROJECT_HOME (stack KSL) ; sandbox Gradle + repair (budget).

Prérequis :
  - yadra project use <name> avec --project-home (PROJECT_HOME requis)
  - yadra validate --semantic sur la spec (outputs.phase recommandé)
  - seal T1 sauf --allow-unsealed (dev)

Options :
  --kinds code,tests   Sous-ensemble de outputs.phase.execute uniquement
  --dry-run            Plan + phase ; aucune écriture (--skip-llm autorisé)
  --no-verify          PRODUIRE sans gradle test / repair
  --allow-unsealed     Dev local sans seal frais
  --skip-llm           Uniquement avec --dry-run

Kinds outputs.phase.gate (docs, e2e) → yadra gate. Sorties : stdout + PROJECT_HOME + .yadra/bundles/.`,
    gate: `Usage: yadra gate [SPEC.spec.ksl | .] [--format human|json] [--kinds a,b] [--dry-run]
              [--allow-unsealed] [--allow-no-execute] [--produce] [--skip-llm] …

T2 · C · LIVRER : kinds outputs.phase.gate (défaut docs, e2e) — Conformance Gate + bundle.

Prérequis :
  - yadra project use avec --project-home
  - yadra execute (evidence dans KSL_PROJECT_HOME/.yadra/bundles/<spec>/manifest.json)
  - seal T1 sauf --allow-unsealed

Options :
  --dry-run            Plan gate + SKILL ; aucune écriture (--skip-llm autorisé)
  --produce            LLM : matérialiser docs/e2e sous PROJECT_HOME avant le gate
  --allow-no-execute   Dev local sans preuve execute
  --kinds docs         Sous-ensemble de outputs.phase.gate

Sortie : SATISFIED | VIOLATED | UNDECIDABLE (codes 0 / 1 / 2).`,
    strategies: `Usage:
  yadra strategies list [options]
  yadra strategies show <id|name> [--format human|json]
  yadra strategies explain <id|name> [contexte feature…] [--skip-llm]

list/show   Catalogue embarqué (sans LLM)
explain     LLM + SKILL strategies/catalog + plan validate

Exemples:
  yadra strategies explain SOLID "checkout REST + postgres"
  yadra strategies list --family principles`,
    doctor: `Usage: yadra doctor

Vérifie Node, manifest, KSL_HOME, projet actif.`,
  };
  return map[name] ?? `No help for: ${name}\n\n${globalHelp()}`;
}

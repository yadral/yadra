---
id: t2-comprendre-contrat
title: T2 · A · COMPRENDRE — spec scellée + résolution des strategies
status: validated
version: 5
aspect: yadra-t2
created: 2026-10-25
updated: 2026-10-28
validated_at: 2026-10-28
source_plan: plan/yadra/v1/yadra-t2-comprendre-contrat.plan.md
validated_by: human
authors: []
---

# Objectif

**T2 · A · COMPRENDRE** transforme une spec KSL scellée en plan court et
exploitable. La commande est **`yadra plan`**.

- Entrée : `*.spec.ksl` scellé sous `KSL_PROJECT_HOME`.
- Références : `catalog.yaml` et les `*.strategy.ksl` (API yadral ou vendor CLI).
- Sortie : stdout `human` ou `json`.
- Aucun Doc First, aucun `.code.ksl`, aucune écriture sous `PROJECT_HOME`.
- B, C et gate sont hors scope.

# Résolution

La partie déterministe :

1. extrait `module`, `outputs.kinds`, `data`, `budget` et toutes les strategies ;
   le kind `ksl`, déjà produit en T1, est exclu du plan T2 ;
2. résout chaque nom contre le catalogue (`Outbox` est l’alias de
   `TransactionalOutbox`) ;
3. fournit `id`, nom canonique, `role`, `profile` et chemin `skeleton` ;
4. trie : architecture → patterns → testing → principes ;
5. signale uniquement les strategies non résolues.

La partie LLM reçoit la spec, le plan déterministe et les squelettes actifs.
Elle ajoute, sans répéter le plan :

- placeholders spécialisés (`<feature>`, `<Entity>`, `<Engine>`) ;
- mapping use cases → rôles des squelettes ;
- contraintes `required` / `forbidden` pertinentes ;
- questions réellement bloquantes.

La sortie LLM reste limitée à **20 lignes utiles**.

# Format human

```text
T2 · plan "<spec>"
  module: <module>
  kinds: <kinds>
  data: <engines>
  budget: <json>

Strategies (ordre de fusion):
  - <déclarée> [<role>] — yadra/strategies/ksl/<id>.strategy.ksl

Spécialisation:
  <complément LLM concis>
```

Avec `--skip-llm`, seule la partie déterministe est imprimée.

# Règles de fusion

- Architecture avant patterns, puis testing, puis principes.
- Respecter l’union des `required` et tous les `forbidden`.
- En cas de conflit de chemin : architecture > pattern > testing.
- Une strategy catalogue sans squelette reste valide, mais n’apporte que son
  `description_hint`.

# CLI — `yadra plan`

```bash
yadra plan [SPEC.spec.ksl | .] [--format human|json] [--kinds a,b] [--skip-llm]
```

| Flag | Rôle |
|------|------|
| **`--format human`** | Plan déterministe + spécialisation LLM concise. |
| **`--format json`** | Plan déterministe structuré, sans LLM. |
| **`--skip-llm`** | Plan déterministe human/json uniquement. |

# Runtime

- Registre : `skills.execute.comprendre`.
- Binding CLI : `plan:A`.
- SKILL : [`execute/partie-a-comprendre/SKILL.md`](../../../../yadra/skills/execute/partie-a-comprendre/SKILL.md).
- Plan : ce fichier v5 (ou sa copie validée).

# Critères de validation

- [x] Plan explicite : **pas** de `.code.ksl`.
- [x] `yadra plan` cite les strategies et leurs fichiers skeleton.
- [x] `--format json` expose les strategies résolues.
- [x] Aucun Doc First.
- [x] Aucun contenu B/C/Gate dans la sortie A.
- [x] SKILL T2 **A** seul dans `registry.yaml` (execute).

# Risque

Les anciens specs peuvent utiliser un nom absent du catalogue : le plan doit le
signaler comme question, sans inventer de squelette.

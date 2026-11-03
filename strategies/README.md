# Strategies catalogue (Yadra)

**`catalog.yaml`** — noms canoniques pour `strategy "<name>" { role, description }` dans les specs KSL.

Sections du catalogue :

| Section | Exemples |
|---------|----------|
| Architecture & baseline | Hexagonal, Validator, FluentCaseTest |
| **Principes de conception** | **SOLID**, **DIY**, DRY, KISS, YAGNI |
| Mapping | Populator/Converter |
| Intégration / API | Outbox, GraphQLStream, AsyncRequest-* |
| Planification / orchestration | **Cronjob**, **SagaTransaction** (profil Multiflex) |
| Design patterns (GoF) | Factory Method, Observer, … |

- Pas de référence URL externe ; descriptions finales sont **contextualisées** en T1 · B · PRODUIRE.
- **`Populator/Converter`** est **un seul** pattern (mapping), pas deux entrées.
- Consommé par la CLI `@yadral/yadra` (vendor embarqué ou ce chemin en dev monorepo).

Consommé par : **T1 · A · COMPRENDRE** — SKILL `formalize/partie-a-comprendre`, plan `yadra-t1-comprendre-intention.plan.md` (§ Résolution des strategies). **B · PRODUIRE** matérialise le compact sans redéduire.

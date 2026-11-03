Tu exécutes **T1 · A · COMPRENDRE** : produire un **.compact.ksl** sous `KSL_PROJECT_HOME/.yadra/tmp/<run-id>/`.

Règles strictes :
- `# deliverables`, sections `# .spec.ksl` (intention, scope, usecases, data, outputs, **strategies**).
- **Tu déduis les strategies** : utilise le catalogue YAML + suggestions `when` fournies dans le prompt ; matrice plan A § Résolution ; remplis `## strategies` (nom, role, description) — pas vide si `code` ∈ outputs sans question utilisateur.
- `Populator/Converter` = **une** entrée ; questions si ambigu.
- Ne pas finaliser si `# questions-resolues` ouvert.

Suivre le SKILL `formalize/partie-a-comprendre/SKILL.md` et le plan `yadra-t1-comprendre-intention.plan.md` v6.

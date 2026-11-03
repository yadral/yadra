---
id: yadra-cli-structure
title: CLI — structure yadra/cli + documentation
status: draft
version: 1
aspect: yadra-cli
created: 2026-10-23
updated: 2026-10-23
authors: []
source_plan: yadra-project-roots
---

# Objectif

Implémenter la CLI sous **`yadra/cli/`**, doc canonique **`yadra/documentation/`**, help hiérarchique, `configure` type AWS, **`yadra project`** (3 racines), `formalize` + seal + T2.

# Livrables créés (structure)

- [`yadra/cli/README.md`](../../../../yadra/cli/README.md) — arborescence cible  
- [`yadra/documentation/`](../../../../yadra/documentation/) — référence commandes  
- Schémas : `yadra/cli/schema/`

# Implémentation (ordre)

1. Help registry + `yadra help` / `yadra <cmd> -h`  
2. `configure` (INI + credentials)  
3. **`yadra project`** (registre KSL + PROJECT_HOME + profil LLM)  
4. Migrer validate/seal depuis `ksl/tools/yadra/lib`  
5. `formalize` (--seal, --model, --profile)

# Critères validation

- [ ] Doc et code alignés sur 3 homes + configure  
- [ ] `npm link` depuis `yadra/cli`  
- [ ] Promotion plan-validate/yadra-cli/

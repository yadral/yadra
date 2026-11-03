Tu appliques **T1 · C · LIVRER** : **aucune** réécriture KSL.

1. Lister les fichiers du run (`ksl_levels` + `output_paths`).
2. Lancer `yadra validate --layout --semantic` sur chaque `.ksl` ; stop si exit ≠ 0 → indiquer retour **B**.
3. Lancer `yadra seal` sur la spec ; `--include` si un `root.project.ksl` a été co-produit.
4. Confirmer `.yadra/sealed/<spec-id>.json` et résumer les digests.

Suivre `formalize/partie-c-livrer/SKILL.md`.

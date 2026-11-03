# `*.strategy.ksl` — squelettes prédéfinis

Un fichier correspond à **une strategy canonique** de
[`../catalog.yaml`](../catalog.yaml). Il décrit sa structure réutilisable ;
le bloc **`examples { java { """…""" } }`** donne une **forme Java illustrative**
(packages, rôles → types) pour rendre T2 plus déterministe — à spécialiser avec
`<basePackage>`, `<Feature>` et la spec KSL, pas à copier tel quel.

### Profils projet (Tontine)

- `hexagonal.strategy.ksl` — exemple Java **order-checkout** (API/SPI/REST/JPA, chemins packages Tontine)
- `validator.strategy.ksl` — `CheckoutRequest` (DTO REST) + `CheckoutValidator` ; lié usecase insufficient-stock
- `populator-converter.strategy.ksl` — `Order` → `OrderResponse` (Mapper, Resolver, Populator, Converter)
- `fluent-case-test.strategy.ksl` — exemple **UseCase / Tester / UT·IT / InMemory / PostgresTestContainer** (fil checkout)

### GoF (22 squelettes `strategy_skeleton 1.0`)

| Famille | Fichiers |
|---------|----------|
| Creational | `abstract-factory`, `builder`, `factory-method`, `prototype`, `singleton` |
| Structural | `adapter`, `bridge`, `composite`, `decorator`, `facade`, `flyweight`, `proxy` |
| Behavioral | `chain-of-responsibility`, `command`, `iterator`, `mediator`, `memento`, `observer`, `state`, `strategy-pattern`, `template-method`, `visitor` |

Chaque entrée GoF de [`catalog.yaml`](../catalog.yaml) référence `skeleton: "ksl/<id>.strategy.ksl"`.

### Async request-reply (6 variantes)

| Catalog `id` | Fichier |
|--------------|---------|
| `async-reply-correlation` | `async-reply-correlation.strategy.ksl` |
| `async-fire-and-forget` | `async-fire-and-forget.strategy.ksl` |
| `async-webhook-callback` | `async-webhook-callback.strategy.ksl` |
| `async-polling-status` | `async-polling-status.strategy.ksl` |
| `async-message-reply` | `async-message-reply.strategy.ksl` |
| `async-sync-fallback` | `async-sync-fallback.strategy.ksl` |

`AsyncRequest-SyncFallback` compose une des variantes de suivi (correlation, polling, message-reply) — la spec doit nommer laquelle.

### Intégration / API

- `transactional-outbox.strategy.ksl` — événement en outbox + même TX que l’agrégat ; relay vers `messaging` KSL
- `graphql-stream.strategy.ksl` — subscriptions et flux incrémentaux GraphQL

### Planification & orchestration (profil `multiflex`)

| Catalog `id` | Fichier |
|--------------|---------|
| `cronjob` | `cronjob.strategy.ksl` — registrar, config cron/enabled, executor + retries |
| `saga-transaction` | `saga-transaction.strategy.ksl` — steps action/compensation, TX par step |

Référence d’implémentation interne équipe : packages `…/common/job` et `…/common/transaction` (Multiflex common lib) — le squelette reste `implementation_language = "project"`.

### Principes (guidelines T2)

- `solid.strategy.ksl` — bloc `concerns` SRP/OCP/LSP/ISP/DIP ; la spec doit citer les lettres actives
- `diy.strategy.ksl` — composition root et câblage explicite (pas de layout type Hexagonal)

## Contrat

```text
strategy_skeleton 1.0

strategy "<nom canonique>" {
  id = "<id catalog.yaml>"
  family = "<famille>"
  implementation_language = "project"

  intent { """…""" }
  applicability { signals = […] }
  participants { participant "<rôle>" { … } }
  relations { relation "<source>" -> "<cible>" { … } }
  algorithm { step <n> { … } }
  generation { required = […] optional = […] forbidden = […] }
  tests { assertion "<id>" { … } }
  composition { compatible = […] }
  examples { java { """ … snippet Java … """ } }
}
```

Les squelettes **principes** peuvent ajouter un bloc `concerns { concern "…" { … } }` à la place de participants détaillés.

Les exemples Java vivent **uniquement** dans chaque `*.strategy.ksl` (pas de fichier snippets externe).
Privilégier le fil **checkout** order-service pour les patterns métier afin que T2 voie la même feature composée.

### Règles

- `implementation_language = "project"` : T2 lit le langage depuis le
  `stack` du projet. Le même squelette peut produire Java, Kotlin, Go, etc.
- Les noms sous `participants` sont des **rôles**, pas des classes imposées.
- T2 spécialise les rôles avec la spec et la description de la strategy.
- B · PRODUIRE ne crée aucun participant absent de `required` ou `optional`.
- `forbidden` contient les raccourcis qui dénaturent le pattern.
- `reference_profile = "tontine"` fixe les conventions observées dans Tontine
  (API/SPI, primary/secondary, Converter/Populator) sans imposer Java :
  `implementation_language = "project"` reste prioritaire.
- Ces fichiers sont une source interne Yadra originale ; ils ne recopient pas
  les exemples d’implémentation d’un site tiers.

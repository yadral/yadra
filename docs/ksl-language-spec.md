# KSL v1.0 — Kom Specification Language (Normative Specification)

**KSL** (*Kom Specification Language*) is a **high-level declarative DSL**, focused on human intent, concrete use cases, API contracts, and delivery directives.

KSL is **neither** imperative code nor micro-level class design. It is the **author-facing contract** (intent, domain modules, features, delivery targets).

**Yadra** (Spec-to-Code Binder — T1/T2, SKILLS, scellement, Conformance Gate) is documented separately: [`yadra-ksl-processing.md`](yadra-ksl-processing.md). The KSL does **not** encode Yadra logic.

**Argument reference** (Terraform Registry style, one page per construct): [`docs/ksl/reference/README.md`](ksl/reference/README.md).

**SKILLS** are **not** listed in KSL. The author writes `strategies { strategy "…" { role, description } … }` and a spec-level `budget { }` in each spec (e.g. Hexagonal + Validator in [`cart-management.spec.ksl`](../ksl/examples/minimal/services/order-service/modules/cart/cart-management.spec.ksl)); **Yadra invokes** the matching project SKILLS from those entries and from `stack` / `project`.

There is **no** separate `.strategy.ksl` file: strategies live **inside** each `*.spec.ksl`.

---

## 1. Document Architecture

All KSL keywords are in **English**. Domain **modules** own specs; they are not infra/Gradle modules (Hexagonal layering is declared as a `strategy` entry with `role = "architecture"`).

Natural attachment (filesystem + explicit `module =` in each spec):

```
services/order-service/
├── order-service.project.ksl
└── modules/
    ├── checkout/
    │   ├── checkout.module.ksl       # owns specs of the checkout domain
    │   ├── order-checkout.spec.ksl
    │   └── guest-checkout.spec.ksl
    └── cart/
        ├── cart.module.ksl           # owns specs of the cart domain
        └── cart-management.spec.ksl
```

| Document | Role |
|----------|------|
| `*.project.ksl` | Root, service, or library |
| `*.module.ksl` | Domain module that **owns** one or more `*.spec.ksl` files |
| `*.spec.ksl` | Vertical feature specification (`module = "<domain>"` required) |

---

## 2. Decentralized `*.project.ksl`

Each service and library maintains its own `*.project.ksl` file linked to the parent project.

### 2.1 Service Project File (`order-service.project.ksl`)

The service defines its parent, stack, dependencies, documentation, E2E paths, and communication partners:

```ksl
ksl 1.0

project "order-service" {
  kind = "service"
  parent = "yadral-platform"
  version = "1.0.0"

  repo {
    path = "services/order-service"
  }

  stack {
    runtime = "kotlin"
    framework = "spring-boot-3"
    data = ["postgres"]
  }

  dependencies {
    parent_build = "root-parent-pom"
    libs = ["domain-common", "testing-fixtures"]
  }

  docs {
    swagger = "/swagger-ui.html"
    redoc = "/redoc"
    path = "docs/api"
  }

  e2e {
    framework = "rest-assured"
    path = "tests/e2e"
  }

  communications {
    service "payment-gateway" {
      protocol = "rest"
      client = "feign"
      in_config = true
    }

    service "inventory-service" {
      protocol = "grpc"
      client = "stub"
      in_config = true
    }
  }

  modules = ["checkout", "cart"]
}
```

### 2.2 Domain module (`*.module.ksl`)

A **domain module** is a bounded business area that **owns** specs. It is not a Gradle/Hexagonal package. Yadra attaches a spec in two complementary ways:

1. **Natural layout** — the spec lives under `modules/<domain>/` next to `<domain>.module.ksl`.
2. **Explicit declaration** — the spec repeats `module = "<domain>"` (same id as folder and `*.module.ksl`).

Optional **business links** between domain modules (not Gradle/infra):

```ksl
module "checkout" {
  service = "order-service"
  depends_on_modules = ["cart"]

  specs = [
    "order-checkout.spec.ksl",
    "guest-checkout.spec.ksl"
  ]
}
```

Optional on a spec: `related_specs = ["order-checkout.spec.ksl"]` when a feature extends or reuses another spec in the same service.

---

## 3. Feature Specification: `*.spec.ksl`

### 3.1 Overall Structure

Each spec **must** declare its domain module (same id as the parent `*.module.ksl` and folder name):

```ksl
ksl 1.0

spec "<feature-id>" {
  module = "checkout"   // explicit attachment to the domain module
  meta { ... }
  openapi { ... }       // High-level contract evolution
  intention { ... }     // Core user problem & value
  scope { ... }         // included / excluded boundaries
  flows { ... }         // Visual flow diagrams (image / URL / web page + description)
  integrations { ... }  // Internal or external APIs (type, auth, doc, in_config)
  messaging { ... }     // Event messaging with free-text specifications (Kafka, Rabbit, SQS)
  storage { ... }       // Object storage shorthand (prefer data { s3 | gcs | blob } when listing data artefacts)
  data { ... }          // Persistence & analytics targets (postgres, bigquery, s3, …)
  usecases { ... }      // Structured scenarios (given, when, then)
  outputs { ... }       // Delivery manifest: kinds + nested docs / e2e (optional; top-level docs/e2e still valid)
  e2e { ... }           // E2E test scenarios (top-level or inside outputs)
  docs { ... }          // API documentation (top-level or inside outputs)
  strategies { ... }    // Named design choices (architecture, patterns, testing) with descriptions
  budget { ... }        // Run limits for the whole spec (repair loops, iterations)
  references { ... }    // Jira, Story, ADR
}
```

### 3.2 OpenAPI Contract Lifecycle (`openapi`)

No tedious listings of HTTP verbs or technical schema models. State the file reference, lifecycle action, and plain-text intent. Yadra binds schema and code adjustments to that contract:

```ksl
openapi {
  ref = "docs/openapi/order-service-v1.yaml"
  action = "update" // create | update | delete | deprecate
  version = "1.2.0"
  breaking_changes = false
  description = """
  Update checkout contract to support synchronous payment authorization and return receipt URL.
  Deprecate legacy v0 checkout endpoint and remove obsolete temporary draft routes.
  """
}
```

### 3.3 Scope Boundaries (`scope`)

Uses English keywords `included` and `excluded` to strictly confine the AI generation:

```ksl
scope {
  included = [
    "Cart validation and currency calculation",
    "Synchronous payment authorization",
    "Transactional Outbox recording and Kafka publication"
  ]
  excluded = [
    "Refund and dispute workflows",
    "Carrier logistics and shipping labels"
  ]
}
```

### 3.4 Visual Flows (`flows`)

Each flow provides a human-readable `description` alongside a pointer to a local image, remote URL, or wiki/Miro web page:

```ksl
flows {
  flow "checkout-nominal-sequence" {
    description = "Nominal sequence for cart validation, stock reservation, and Outbox publication"
    ref = "docs/diagrams/order-checkout-flow.png"
  }
}
```

### 3.5 API Integrations with `type` and `auth` (`integrations`)

- `type`: `"internal"` (partner service from `project.ksl`) or `"external"` (third-party service).
- `auth`: `"jwt"`, `"apikey"`, `"oauth2"`, `"basic"`, `"none"`.
- `doc`: link to third-party documentation for external APIs.
- `in_config`: `true` to mandate configuration injection (e.g., Spring `@ConfigurationProperties`).

```ksl
integrations {
  api "payment-gateway" {
    type = "internal"
    endpoint = "POST /api/v1/payments/authorize"
    auth = "jwt"
    in_config = true
  }

  api "stripe-fraud-check" {
    type = "external"
    endpoint = "POST https://api.stripe.com/v1/radar/early_fraud_warnings"
    doc = "https://docs.stripe.com/api/radar/early_fraud_warnings"
    auth = "apikey"
    in_config = true
  }
}
```

### 3.6 Event Messaging with Free-Text Directives (`messaging`)

Describe consumers, retries, partitions, and DLQ in natural language under `description`:

```ksl
messaging {
  kafka {
    topic = "orders.order-paid.v1"
    role = "producer"
    in_config = true
    description = """
    Publish OrderPaidEvent using transactional outbox pattern.
    Downstream requires 2 consumer instances in notification-worker service,
    with manual acknowledgement and a Dead Letter Queue (DLQ) after 3 retries.
    """
  }
}
```

### 3.7 Structured Use Cases (`usecases`)

```ksl
usecases {
  usecase "nominal-checkout" {
    description = "Standard order checkout with accepted payment"
    given = "Customer with non-empty cart, available inventory, valid credit card"
    when = [
      "1. Customer submits checkout",
      "2. System reserves stock with InventoryService",
      "3. System authorizes payment with PaymentGateway",
      "4. Order is persisted as PAID with Outbox event"
    ]
    then = [
      "Order is saved with PAID status",
      "OrderPaid event is in Outbox table",
      "201 Created response is returned with order ID"
    ]
  }
}
```

### 3.8 Data targets (`data`)

When the spec asks Yadra to produce **data** artefacts (schemas, migrations, warehouse DDL, bucket policies), declare **concrete engines** in `data { }`:

| Target | Typical attributes |
|--------|---------------------|
| `postgres`, `mysql`, `mariadb` | `schema`, `database`, `description`, `in_config` |
| `bigquery`, `snowflake` | `project`, `dataset`, `description`, `in_config` |
| `redis` | `database`, `description`, `in_config` |
| `s3`, `gcs`, `blob` | `bucket`, `description`, `in_config` |

The legacy top-level `storage { s3 { ... } }` block remains valid; prefer `data { s3 { ... } }` when `"data"` is in the delivery manifest so relational and object/analytics targets stay in one place.

```ksl
data {
  postgres {
    schema = "cart"
    database = "order_service"
    in_config = true
    description = "cart and cart_line tables; Flyway migrations as verified data artefacts."
  }
}
```

Service `stack.data = ["postgres", "bigquery"]` in `*.project.ksl` states **what the repo may use**; the spec’s `data { }` block states **what this feature must create or change**.

### 3.9 Delivery manifest: `outputs`, `docs`, and `e2e`

**Yadra verified artefact families** (declare in `outputs.kinds`):

| Kind | Meaning |
|------|---------|
| `ksl` | KSL files refined or emitted (T1 synthesis, contract deltas, module metadata) |
| `code` | Application / service source for the target stack |
| `data` | Database migrations, warehouse DDL, object-store layout — requires matching `data { }` (and/or `messaging { }` for event contracts) |
| `tests` | Unit / integration tests |
| `docs` | Swagger, Redoc, Confluence, Jira sync — requires `docs { }` (top-level or nested) |
| `e2e` | End-to-end scenarios — requires `e2e { }` |

`"database"` in older specs is an alias for `"data"` when only relational scripts are meant.

Three complementary levels:

| Level | Where | Role |
|-------|--------|------|
| **Service defaults** | `*.project.ksl` → `docs { swagger, redoc, path }`, `e2e { framework, path }`, `stack.data` | Default routes, test folder, allowed data engines |
| **Feature manifest** | `outputs { kinds = [...], docs { ... }, e2e { ... } }` | Single place for **what** this spec delivers |

Top-level `docs` / `e2e` blocks remain valid; nesting them under `outputs { }` groups the full delivery story (see [`cart-management.spec.ksl`](../examples/minimal/services/order-service/modules/cart/cart-management.spec.ksl)).

**Swagger** and **Redoc** need an explicit destination:
- Soit un **endpoint HTTP / route d'exposition** web (ex: `swagger = "/swagger-ui.html"`, `redoc = "/redoc"`).
- Soit un **chemin de fichier d'export statique** (ex: `swagger = "docs/swagger.html"`, `path = "docs/api"`).

Aux côtés de **Confluence** (URL de la page wiki) et **Jira** (`update_jira = true`), `swagger` et `redoc` portent donc directement leur **route ou chemin d'accès** :

```ksl
docs {
  title = "Order Checkout API Specification"
  swagger = "/docs/swagger-ui"     // route HTTP ou chemin du bundle swagger
  redoc = "/docs/redoc"           // route HTTP ou chemin du bundle redoc
  confluence = "https://docs.yadral.com/display/ARCH/Order+Checkout"
  update_jira = true              // met à jour la description du ticket Jira
}
```

Au niveau du service (`*.project.ksl`), on peut également définir les routes par défaut :

```ksl
docs {
  swagger = "/swagger-ui.html"
  redoc = "/redoc"
  path = "docs/api"
}

e2e {
  framework = "rest-assured"
  path = "tests/e2e" // optionnel, convention par défaut
}
```

Processing of delivery targets at build time is defined in [`yadra-ksl-processing.md`](yadra-ksl-processing.md), not in KSL syntax.

Example consolidated manifest:

```ksl
outputs {
  kinds = ["ksl", "code", "data", "tests", "docs", "e2e"]

  docs {
    title = "Cart API"
    swagger = "/docs/swagger-ui"
    redoc = "/docs/redoc"
  }

  e2e {
    scenarios = ["Add line, update quantity, remove line on active cart"]
    mock_externals = false
  }
}
```

### 3.10 Design strategies (`strategies`)

One or more **named** architecture / pattern / testing choices. Each entry **must** include a **`description`** (where in the codebase and how you apply it). Optional **`role`** helps Yadra map entries to SKILLS (`architecture`, `pattern`, `testing`, …):

```ksl
strategies {
  strategy "Hexagonal" {
    role = "architecture"
    description = """
    Application use cases and domain in modules/checkout; REST and JPA adapters
    in infrastructure; no business rules in controllers.
    """
  }
  strategy "Validator" {
    role = "pattern"
    description = """
    Validate checkout preconditions in the domain layer before persisting orders.
    """
  }
  strategy "FluentCaseTest" {
    role = "testing"
    description = """
    Express use case scenarios as Given/When/Then tests under src/test.
    """
  }
}
```

Delivery kinds stay in **`outputs { kinds = [...] }`** only (no duplicate list under `strategies`).

### 3.11 Run budget (`budget`)

The **`budget`** block applies to the **entire spec** (all outputs and the full T2 compile–repair loop for this feature). It is **not** nested under `strategies`.

```ksl
budget {
  max_repair_loops = 5
  max_iterations = 8
}
```

Yadra reads `budget` with the sealed spec contract; see [`yadra-ksl-processing.md`](yadra-ksl-processing.md).

---

## 4. Authoring conventions (layout)

- `services/<service>/<service>.project.ksl`
- `services/<service>/modules/<domain>/<domain>.module.ksl`
- `services/<service>/modules/<domain>/*.spec.ksl` with `module = "<domain>"`
- Each spec file lists itself in the parent module’s `specs = [...]`

---

## 5. Full examples

| File | Role |
|------|------|
| [`order-checkout.spec.ksl`](../ksl/examples/minimal/services/order-service/modules/checkout/order-checkout.spec.ksl) | **Reference maximale** : openapi, flows, integrations, messaging, `data`, usecases, `outputs`, `strategies`, `budget` (spec-level) |
| [`guest-checkout.spec.ksl`](../ksl/examples/minimal/services/order-service/modules/checkout/guest-checkout.spec.ksl) | Variante complète (`related_specs`, même manifeste de livraison, périmètre guest) |
| [`cart-management.spec.ksl`](../ksl/examples/minimal/services/order-service/modules/cart/cart-management.spec.ksl) | Module domaine cart : openapi, flows, `data { postgres }`, manifeste `outputs` complet |

# module

Domain module owning [spec](spec.md) files. File: `*.module.ksl`.

## Example Usage

```ksl
module "checkout" {
  service = "order-service"
  specs = [ "order-checkout.spec.ksl" ]
  vocabulary {
    term "Checkout" = "Payment capture for a cart"
  }
}
```

## Imbrication

| Block | Chain | Description |
|-------|-------|-------------|
| `module "…" { … }` | *(this file)* | this page |
| `meta { … }` | module → [meta](meta.md) | [meta](meta.md) |
| `vocabulary { … }` | module → vocabulary → term | below |
| `*.spec.ksl` | module → [spec](spec.md) | [spec](spec.md) |

## vocabulary → term

```ksl
vocabulary {
  term "<label>" = "<definition>"
}
```

## Top-level arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `service` | string | no | Hosting [project](project.md) id. |
| `specs` | list(string) | recommended | Spec filenames in this folder. |
| `depends_on_modules` | list(string) | no | Other domain modules. |

Each spec must set `module = "<domain-id>"` matching this module.

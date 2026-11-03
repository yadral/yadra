# outputs

Delivery manifest (`kinds`) for T2 · Produire.

**Imbrication :** [spec](spec.md) → **outputs** → docs / e2e

| Block | Chain | Description |
|-------|-------|-------------|
| `outputs { … }` | spec → outputs → [spec-docs](spec-docs.md) / [spec-e2e](spec-e2e.md) | this page |
| `docs { … }` inside outputs | spec → outputs → docs | [spec-docs](spec-docs.md) |
| `e2e { … }` inside outputs | spec → outputs → e2e | [spec-e2e](spec-e2e.md) |

`docs` / `e2e` may also sit directly under `spec` (same members).

## Example Usage

```ksl
outputs {
  kinds = ["code", "data", "tests", "docs", "e2e"]
  phase {
    execute = ["code", "data", "tests"]
    gate = ["docs", "e2e"]
  }
  docs { swagger = "/swagger-ui" }
  e2e { scenarios = ["Nominal checkout"] }
}
```

## Argument Reference

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `kinds` | list(string) | **yes** (recommended) | `code`, `data`, `tests`, `docs`, `e2e`, `ksl`. |
| `targets` | list(string) | no | Alias of `kinds`. |
| `phase { execute gate }` | lists | recommended | Routes kinds to **`yadra execute`** vs **`yadra gate`**. Each non-`ksl` kind in `kinds` must appear exactly once in `execute` or `gate`. |

If `phase` is omitted, Yadra defaults: **execute** = `code`, `data`, `tests` (plus unknown kinds); **gate** = `docs`, `e2e`.

Co-requisites: [strategies](strategies.md) for `code`/`tests`, [data](data.md) for `data`. Kind **`code`** → T2 · A resolves [`*.strategy.ksl`](../../../yadra/strategies/ksl/README.md) (see [code-ksl](code-ksl.md) — no compact file).

**Paths:** `code` / `tests` / `data` file layout is derived from [project](project.md) `repo`, `stack`, spec `data { }`, and strategy skeleton `participant.path` — not declared per kind in `outputs`. `docs` / `e2e` blocks carry routes and paths (gate).

## Consumed by Yadra

`yadra plan` (all kinds + phase), `yadra execute` (`phase.execute`), `yadra gate` (`phase.gate`, future).

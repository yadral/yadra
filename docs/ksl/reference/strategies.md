# strategies

Design choices container (architecture, patterns, testing). Yadra maps **SKILLS** from nested [strategy](strategy.md) entries — never from KSL lists.

**Imbrication :** [spec](spec.md) → **strategies** → [strategy](strategy.md)

| Block | Chain | Description |
|-------|-------|-------------|
| `strategies { … }` | spec → strategies → [strategy](strategy.md) | this page |
| `strategy "<name>" { … }` | spec → strategies → strategy | [strategy](strategy.md) |

## Example Usage

```ksl
strategies {
  strategy "Hexagonal" {
    role = "architecture"
    description = """
    Domain and use cases in application layer; adapters for REST and JPA.
    """
  }
}
```

## Argument Reference

`strategies` has no own keys — only child [`strategy`](strategy.md) blocks.

## Notes

- EBNF: `strategies_block` → `{ strategy_decl }`.
- Delivery kinds: [outputs](outputs.md), not here.
- Canonical names (GoF, **SOLID**, **DIY**, baseline, …): [`yadra/strategies/catalog.yaml`](../../../yadra/strategies/catalog.yaml) — section **Principes de conception** for guidelines, not GoF entries.

## Consumed by Yadra

T2 · A: `yadra plan`. Catalogue noms : `yadra strategies list|show` (CLI 0.1.3+). T2 · B: SKILLS from strategy name, role, description.

# integrations

HTTP/API partners.

**Imbrication :** [spec](spec.md) → **integrations** → api

| Block | Chain | Description |
|-------|-------|-------------|
| `integrations { … }` | spec → integrations → api | this page |
| `api "<name>" { … }` | spec → integrations → api | below |

## Example Usage

```ksl
integrations {
  api "payment-gateway" {
    type = "external"
    endpoint = "https://pay.example.com/v1"
    auth = "oauth2"
  }
}
```

## api

| Argument | Type | Description |
|----------|------|-------------|
| `type` | string | `internal` / `external`. |
| `service`, `endpoint`, `auth`, `doc`, `in_config` | | Partner wiring. |

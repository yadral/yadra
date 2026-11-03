---
title: projects.json
description: Yadra project registry and current project (v0.1.1+).
---

File **`~/.config/yadra/projects.json`**: many named projects, one **`current`**.

## Example

```json
{
  "version": 1,
  "current": "tontine",
  "projects": {
    "tontine": {
      "kslProjectHome": "/Users/mac/IdeaProjects/tontine/a-experiment-ksl",
      "projectHome": "/Users/mac/IdeaProjects/tontine/tontine-app",
      "yadraProjectHome": "/opt/yadra",
      "rootProjectFile": "root.project.ksl",
      "projectId": "tontine-platform",
      "llm": {
        "profile": "default",
        "model": "claude-sonnet-4-20250514"
      },
      "updatedAt": "2026-10-25T12:00:00.000Z"
    }
  }
}
```

## Root fields

| Field | Description |
|-------|-------------|
| `version` | `1` |
| `current` | Active project name (`null` if none) |
| `projects` | Map of name → record |

## Per-project fields

| Field | Required | Description |
|-------|----------|-------------|
| `kslProjectHome` | Yes | **Absolute** KSL repository path |
| `projectHome` | No | **Absolute** application repo path |
| `yadraProjectHome` | No | Yadra distribution / grammar |
| `rootProjectFile` | No | Relative root KSL file |
| `projectId` | No | Root `project` id |
| `llm.profile` | No | configure profile |
| `llm.model` | No | Default model |
| `updatedAt` | No | ISO-8601 |

Manual edits are possible; prefer `yadra project add` / `update` for KSL root validation.

See [`yadra project`](/docs/en/project/).

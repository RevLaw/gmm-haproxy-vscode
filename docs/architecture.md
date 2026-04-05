# Architecture — HAProxy Config VSCode Extension

## Overview

This extension follows the **Language Server Protocol (LSP)** pattern: a thin VSCode client handles editor integration, while a standalone language server process owns all language intelligence. This separation keeps the extension host fast and makes the server independently testable without VSCode.

```
┌─────────────────────────────────────────────────────────────────────┐
│  VSCode Extension Host                                              │
│                                                                     │
│  client/src/extension.ts                                           │
│  ├─ Activates on onLanguage:haproxy                                │
│  ├─ Creates LanguageClient (stdio/IPC transport)                   │
│  ├─ Status bar: "HAProxy: 3.1"                                     │
│  └─ Commands: haproxy.selectVersion, haproxy.restartServer         │
└───────────────────────┬─────────────────────────────────────────────┘
                        │  IPC (stdio)
                        │  LSP JSON-RPC messages
┌───────────────────────▼─────────────────────────────────────────────┐
│  Language Server Process (server/src/server.ts)                    │
│                                                                     │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────────┐ │
│  │   Parser    │   │  VersionRegistry │   │    Settings Cache    │ │
│  │  HaproxyDoc │◄──│  (per-version   │   │  haproxy.version     │ │
│  │  AST cache  │   │   directive map) │   │  haproxy.validate    │ │
│  └──────┬──────┘   └────────┬────────┘   └──────────────────────┘ │
│         │                   │                                       │
│  ┌──────▼───────────────────▼──────────────────────────────────┐   │
│  │                    Providers                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │  Validation  │  │  Completion  │  │      Hover       │  │   │
│  │  │  Provider    │  │  Provider    │  │    Provider      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │   │
│  │                                                              │   │
│  │  ┌──────────────┐                                           │   │
│  │  │  Formatting  │                                           │   │
│  │  │  Provider    │                                           │   │
│  │  └──────────────┘                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Data Layer (read-only)                      │ │
│  │  server/src/data/directives.ts  — 100+ proxy directives        │ │
│  │  server/src/data/global.ts      — 80+  global directives       │ │
│  │  server/src/data/types.ts       — shared type definitions      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Direction

Dependencies flow strictly downward. No circular imports. No provider imports from another provider.

```
VSCode API
    ↓
client/extension.ts          ← imports: vscode, vscode-languageclient
    ↓ (IPC)
server/server.ts             ← imports: vscode-languageserver-*
    ↓
parser/ast.ts                ← pure types, no imports
parser/parser.ts             ← imports: ast.ts only
    ↓
registry/versionRegistry.ts  ← imports: data/*, parser/ast.ts
    ↓
providers/*                  ← imports: registry, parser/ast, vscode-languageserver
    ↓
data/types.ts                ← imports: parser/ast (SectionType only)
data/directives.ts           ← imports: data/types.ts
data/global.ts               ← imports: data/types.ts
```

---

## Key Design Decisions

### 1. Fault-Tolerant Parser

The parser never throws. On any syntax error it emits a `ParseError` and continues, producing the best possible partial AST. This means:
- Diagnostics still work on broken configs
- Completion still works while the user is typing
- The editor never goes dark mid-edit

### 2. Immutable AST

All AST node interfaces use `readonly` on every field. After `HaproxyParser.parse()` returns, the document is never mutated. The only exception is `resolveMode()`, which runs once during construction before the object is returned.

### 3. AST Cache + Debounced Validation

```
textDocument/didChange
    → invalidate AST cache for URI
    → parse immediately (fast, ~5ms)
    → debounce 400ms → validate → publishDiagnostics
```

Parsing is synchronous and cheap. Validation reads the registry (cached), so it's also fast. The 400ms debounce prevents flooding on rapid keystrokes.

### 4. Version-Aware Registry

The `VersionRegistry` filters all directives by `since` / `deprecated` / `removed` fields at query time. Results are cached per resolved version so the filter runs only once per version string.

Version resolution: if the requested version is not a known version, the registry finds the nearest lower known version. Example: `2.9` → `2.8`.

### 5. Single Source of Truth for Directives

All directive knowledge lives in two TypeScript files:
- `server/src/data/directives.ts` — proxy section directives (defaults/frontend/backend/listen)
- `server/src/data/global.ts` — global section directives

These are compiled arrays of `DirectiveDef` objects. There are no JSON files — TypeScript gives us type safety and IDE support while authoring the data.

---

## Process Lifecycle

```
1. VSCode opens a .cfg or .conf file
2. onLanguage:haproxy activates the extension
3. client creates LanguageClient → spawns server/out/server.js
4. server onInitialize → declares capabilities
5. server onInitialized → requests workspace/configuration
6. For each open document:
   a. textDocument/didOpen → parse → debounce validate
   b. textDocument/didChange → invalidate cache → parse → debounce validate
   c. textDocument/didClose → clear AST cache, clear diagnostics
7. On completion request → parse (from cache) → CompletionProvider
8. On hover request → parse (from cache) → HoverProvider
9. On formatting request → FormattingProvider (works on raw text, no AST needed)
10. onShutdown → clean up timers → exit
```

---

## Bundle Strategy

Two separate esbuild bundles, one per process:

| Bundle | Entry | Output | Process |
|--------|-------|--------|---------|
| Client | `client/src/extension.ts` | `client/out/extension.js` | VSCode Extension Host |
| Server | `server/src/server.ts` | `server/out/server.js` | Node.js child process |

Source maps in development, stripped in production. Both target `node` platform, `commonjs` format (required by the VSCode extension host).

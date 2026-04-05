# Technical Documentation

Complete technical reference for the HAProxy Config VSCode Extension codebase.

---

## Documents

| Document | What it covers |
|----------|---------------|
| [architecture.md](./architecture.md) | System design, component diagram, LSP process lifecycle, bundle strategy |
| [data-model.md](./data-model.md) | All TypeScript interfaces — AST nodes, directive definitions, section matrix |
| [parser.md](./parser.md) | How the fault-tolerant parser works, tokenization, mode resolution, limitations |
| [version-registry.md](./version-registry.md) | VersionRegistry API, version resolution, caching, how to add new versions/directives |
| [providers.md](./providers.md) | ValidationProvider, CompletionProvider, HoverProvider, FormattingProvider — algorithms and behavior |
| [testing.md](./testing.md) | Jest setup, mock strategy, what to test, coverage requirements, CI |
| [development.md](./development.md) | Setup, npm scripts, workflow, adding new features, debugging, release checklist |
| [haproxy-domain.md](./haproxy-domain.md) | HAProxy config format, sections, proxy matrix, mode, versioning, validation rules |

---

## Quick Reference

### Where does directive knowledge live?

```
server/src/data/directives.ts  — proxy section directives (defaults/frontend/backend/listen)
server/src/data/global.ts      — global section directives
server/src/data/types.ts       — DirectiveDef, SectionMatrix, and helper constants
```

### Where is validation logic?

```
server/src/validation/validator.ts  — ValidationProvider.validate(doc)
```

### Where is the parser?

```
server/src/parser/parser.ts  — HaproxyParser.parse(text, uri)
server/src/parser/ast.ts     — AST interfaces (HaproxyDocument, HaproxySection, etc.)
```

### How do I add a new HAProxy version?

See [version-registry.md → Adding a New HAProxy Version](./version-registry.md#adding-a-new-haproxy-version).

### How do I add a new directive?

See [version-registry.md → Adding a New Directive](./version-registry.md#adding-a-new-directive).

### How do I add a new language feature (e.g. code actions)?

See [development.md → Adding a New Language Feature](./development.md#adding-a-new-language-feature).

---

## Architecture in One Paragraph

The extension uses the **Language Server Protocol**: VSCode runs a thin client (`client/src/extension.ts`) that spawns a standalone Node.js language server (`server/src/server.ts`). The server owns all intelligence — it parses HAProxy configs into an immutable AST, caches the AST per document URI, and exposes four providers (validation, completion, hover, formatting) that each read the AST and return LSP-typed results. Directive knowledge lives in two TypeScript data files that are filtered at query time by the `VersionRegistry` to match the user's selected HAProxy version (2.4 through 3.1).

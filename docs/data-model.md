# Data Model

This document describes every typed structure in the codebase — the AST, the directive definitions, and the section matrix.

---

## AST (`server/src/parser/ast.ts`)

### `SourceRange`

Every AST node carries a source range for diagnostics, hover highlighting, and formatting. All values are **0-based**.

```typescript
interface SourceRange {
  startLine: number;      // 0-based line index
  startCharacter: number; // 0-based column index
  endLine: number;
  endCharacter: number;
}
```

### `Token`

A single lexed word or quoted string from the source text.

```typescript
interface Token {
  value: string;       // the raw string value (quotes stripped if quoted)
  range: SourceRange;  // position in source
}
```

### `DirectiveArg`

An argument to a directive. Structurally identical to `Token` but semantically distinct — it represents a value after the keyword, not the keyword itself.

```typescript
interface DirectiveArg {
  value: string;
  range: SourceRange;
}
```

### `HaproxyDirective`

A single parsed directive line inside a section.

```typescript
interface HaproxyDirective {
  keyword: Token;              // the directive name, e.g. "option"
  args: readonly DirectiveArg[]; // everything after the keyword
  range: SourceRange;          // span of the entire line
  raw: string;                 // original source text (for formatting)
}
```

**Example** — the line `    option httplog`:
```
keyword: { value: "option", range: { startLine: 5, startCharacter: 4, ... } }
args:    [{ value: "httplog", range: { startLine: 5, startCharacter: 11, ... } }]
```

### `SectionType`

Union of all valid HAProxy top-level section names.

```typescript
type SectionType =
  | 'global' | 'defaults' | 'frontend' | 'backend' | 'listen'
  | 'userlist' | 'peers' | 'resolvers' | 'mailers' | 'ring'
  | 'log-forward' | 'program' | 'http-errors' | 'cache'
  | 'unknown';
```

### `HaproxySection`

A single parsed section block, e.g. `frontend http-in { ... }`.

```typescript
interface HaproxySection {
  type: SectionType;                   // 'frontend', 'backend', etc.
  name: string;                        // the label after the keyword, e.g. "http-in"
  headerRange: SourceRange;            // position of the section header line
  directives: readonly HaproxyDirective[];
  mode: 'http' | 'tcp' | undefined;   // resolved from 'mode' directive or inherited from defaults
}
```

**Mode resolution**: The parser resolves `mode` in two passes:
1. Within each section: find any `mode http` or `mode tcp` directive.
2. After all sections are built: if a `frontend`/`backend`/`listen` has no explicit mode, inherit from the `defaults` section.

### `HaproxyDocument`

The top-level parse result. One per open document, keyed by URI in the server's AST cache.

```typescript
interface HaproxyDocument {
  uri: string;
  sections: readonly HaproxySection[];
  parseErrors: readonly ParseError[];
}
```

### `ParseError`

A non-fatal parse anomaly. The parser continues after recording these. They become `DiagnosticSeverity.Error` diagnostics.

```typescript
interface ParseError {
  message: string;
  range: SourceRange;
}
```

---

## Directive Definitions (`server/src/data/types.ts`)

### `SectionMatrix`

Encodes exactly which sections a directive is valid in, using typed boolean fields instead of a string array. This allows TypeScript to catch missing fields at compile time when adding new directives.

```typescript
interface SectionMatrix {
  defaults: boolean;
  frontend: boolean;
  listen: boolean;
  backend: boolean;
  global?: boolean;  // only for global-section directives
}
```

**Pre-built helpers** (avoids repeating the same pattern for every directive):

| Constant | D | F | L | B | Description |
|----------|---|---|---|---|-------------|
| `ALL_PROXY` | ✓ | ✓ | ✓ | ✓ | Valid everywhere in proxy sections |
| `DFLB` | ✓ | ✓ | ✓ | ✓ | Alias for ALL_PROXY |
| `DLB` | ✓ | ✗ | ✓ | ✓ | Not valid in frontend |
| `DFL` | ✓ | ✓ | ✓ | ✗ | Not valid in backend |
| `FL` | ✗ | ✓ | ✓ | ✗ | Frontend and listen only |
| `LB` | ✗ | ✗ | ✓ | ✓ | Listen and backend only |
| `FLB` | ✗ | ✓ | ✓ | ✓ | Not valid in defaults |

### `DirectiveCategory`

Used to group completion items in the UI.

```typescript
type DirectiveCategory =
  | 'connection' | 'logging' | 'routing' | 'load-balancing'
  | 'health-check' | 'timeout' | 'option' | 'acl'
  | 'http' | 'tcp' | 'ssl' | 'server' | 'stats'
  | 'stick' | 'compression' | 'misc';
```

### `DirectiveDef`

The canonical definition of a single HAProxy directive. Every entry in `directives.ts` and `global.ts` implements this interface.

```typescript
interface DirectiveDef {
  name: string;           // exact directive keyword as it appears in config
  signature: string;      // human-readable parameter syntax, e.g. "<addr>:<port>"
  description: string;    // one-line description shown in hover and completion
  sections: SectionMatrix;
  since: string;          // HAProxy version this was introduced, e.g. "2.4"
  deprecated?: string;    // version when deprecated (still works)
  removed?: string;       // version when fully removed (errors out in HAProxy)
  httpOnly?: true;        // only valid when section mode is http
  tcpOnly?: true;         // only valid when section mode is tcp
  invertible?: true;      // can be prefixed with "no " to invert
  docsUrl?: string;       // link to official HAProxy docs
  category?: DirectiveCategory;
}
```

---

## Registry (`server/src/registry/versionRegistry.ts`)

### `DirectiveDefinition`

The public-facing shape exposed by the registry to providers. Derived from `DirectiveDef` with `sections` converted from `SectionMatrix` to `SectionType[]` for easy lookup.

```typescript
interface DirectiveDefinition {
  name: string;
  sections: readonly SectionType[];    // ['defaults', 'frontend', 'listen', 'backend']
  description: string;
  signature: string;
  sinceVersion: string;
  deprecatedSinceVersion?: string;
  removedInVersion?: string;
  docsUrl?: string;
  tcpOnly?: boolean;
  httpOnly?: boolean;
  invertible?: boolean;
  category?: string;
}
```

### `KnownVersion`

A union type of all HAProxy versions the registry knows about.

```typescript
type KnownVersion = '2.4' | '2.6' | '2.8' | '3.0' | '3.1';
```

---

## Data Files

### `server/src/data/directives.ts`

Contains the `DIRECTIVES` array — all proxy-section directives valid in `defaults`, `frontend`, `backend`, and/or `listen`. ~100+ entries covering:

- ACL (`acl`)
- Load balancing (`balance`, `hash-type`, `fullconn`)
- Server definition (`server`, `server-template`, `default-server`)
- Health checks (`option httpchk`, `http-check *`, `tcp-check *`)
- HTTP processing (`http-request`, `http-response`, `http-after-response`)
- TCP processing (`tcp-request`, `tcp-response`)
- Options (~35 `option` variants)
- Timeouts (11 variants)
- Logging (`log`, `log-format`, `log-format-sd`, `log-tag`)
- Stick tables (`stick-table`, `stick on`, `stick match`, `stick store-request`, `stick store-response`)
- Stats (`stats uri`, `stats enable`, etc.)
- SSL/TLS (`bind` with ssl params)
- Deprecated directives (`reqrep`, `rsprep`, `reqadd`, etc. — kept with `removed` version set)

### `server/src/data/global.ts`

Contains the `GLOBAL_DIRECTIVES` array — directives valid only in the `global` section. ~80+ entries covering:

- **Process management**: `daemon`, `master-worker`, `nbthread`, `cpu-map`, `chroot`, `user`, `group`, `pidfile`
- **Limits**: `maxconn`, `maxconnrate`, `maxsessrate`, `ulimit-n`, `fd-hard-limit`
- **Logging**: `log`, `log-send-hostname`, `log-tag`
- **Stats socket**: `stats socket`, `stats timeout`, `stats maxconn`
- **SSL defaults**: `ssl-default-bind-*`, `ssl-default-server-*`, `ssl-dh-param-file`, `ssl-server-verify`
- **Lua**: `lua-load`, `lua-load-per-thread`, `lua-prepend-path`
- **Environment**: `presetenv`, `setenv`, `resetenv`, `unsetenv`
- **Performance tuning** (`tune.*`): buffers, HTTP header limits, H2 parameters, SSL session cache
- **Protocol flags**: `noepoll`, `nosplice`, `noreuseport`, etc.
- **Hardening**: `harden.reject-privileged-ports.tcp`, `harden.reject-privileged-ports.quic`
- **OCSP**: `ocsp-update.*` directives

---

## How `matrixToSections` Works

The `matrixToSections` helper converts a `SectionMatrix` to the `SectionType[]` array used by providers:

```typescript
function matrixToSections(m: SectionMatrix): SectionType[] {
  const out: SectionType[] = [];
  if (m.global)   out.push('global');
  if (m.defaults) out.push('defaults');
  if (m.frontend) out.push('frontend');
  if (m.listen)   out.push('listen');
  if (m.backend)  out.push('backend');
  return out;
}
```

The order (`global → defaults → frontend → listen → backend`) is canonical and matches the HAProxy documentation section ordering.

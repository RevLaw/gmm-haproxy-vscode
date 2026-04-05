# Parser

**File:** `server/src/parser/parser.ts`

The `HaproxyParser` transforms raw HAProxy config text into a typed `HaproxyDocument` AST. It is **fault-tolerant**: it never throws, always produces the best possible AST from whatever text it receives, and records any anomalies in `parseErrors`.

---

## Entry Point

```typescript
class HaproxyParser {
  parse(text: string, uri: string): HaproxyDocument
}
```

The parser is stateless — create one instance and reuse it, or call `parse()` directly.

---

## Parsing Pipeline

```
text string
    ↓
split on /\r?\n/             — handle CRLF and LF
    ↓
for each line:
    stripComment()           — remove #-comments, respecting quoted strings
    trim()
    line continuation        — join lines ending with backslash
    tokenizeLine()           — split into Token[] handling quoted strings
    ↓
classify first token:
    ├─ section keyword       → close current section, open new SectionBuilder
    └─ other                 → addDirective() to current SectionBuilder
                              (or ParseError if no current section)
    ↓
resolveMode()                — propagate defaults mode to frontend/backend/listen
    ↓
HaproxyDocument
```

---

## Line Continuation

Lines ending with `\` are joined with the next line. This loop continues until the joined line does not end with `\`:

```
bind :443 \
     ssl \
     crt /etc/ssl/haproxy.pem
```

becomes a single directive:
```
bind :443 ssl crt /etc/ssl/haproxy.pem
```

The `lineIndex` is advanced for each consumed continuation line, so source ranges remain accurate for the final joined line.

---

## Comment Stripping (`stripComment`)

Strips everything from `#` to end of line, but respects quoted strings — a `#` inside a quoted value is not a comment.

```
log 127.0.0.1 local0  # this is stripped
log "127.0.0.1#1" local0  # "127.0.0.1#1" — the # inside quotes is kept
```

Handles:
- Both `"` and `'` as quote delimiters
- `\"` and `\'` escape sequences inside quoted strings

---

## Tokenization (`tokenizeLine`)

Splits a line into `Token[]` with accurate source ranges. Handles:

- **Whitespace**: any sequence of spaces/tabs between tokens
- **Quoted strings**: both `"..."` and `'...'`. Quote delimiters are stripped; the `value` contains the raw string contents. Escape sequences (`\"`, `\\`) are handled.
- **Unquoted tokens**: any non-whitespace sequence

Each `Token` carries the exact `startCharacter` and `endCharacter` column positions, used for precise hover highlighting and diagnostic ranges.

---

## Section Detection

The first token of a line is compared (case-insensitively) against the set of known section keywords:

```
global defaults frontend backend listen
userlist peers resolvers mailers ring
log-forward program http-errors cache
```

If it matches, a new `SectionBuilder` is created. The previous section (if any) is finalized and pushed to the result.

If it does not match and there is no current section, a `ParseError` is emitted:
```
Directive 'xxx' appears outside of any section.
```

---

## Mode Resolution (`resolveMode`)

After all sections are built, a second pass resolves `mode`:

1. Find the `defaults` section (if any).
2. Read its `mode` directive.
3. For every `frontend`, `backend`, and `listen` section that has no explicit `mode` directive, inherit the defaults mode.

This allows validation and completion to correctly apply `httpOnly`/`tcpOnly` filters even when `mode` is only declared once in `defaults`.

---

## Source Range Accuracy

All ranges are 0-based (matching LSP conventions):

| Range type | What it covers |
|------------|---------------|
| `directive.range` | Full directive line (column 0 to end of trimmed content) |
| `directive.keyword.range` | Just the keyword token (for precise diagnostics) |
| `directive.args[n].range` | The n-th argument token |
| `section.headerRange` | The full section header line |

---

## Example

Input:
```haproxy
# Main frontend
frontend http-in
    bind *:80
    default_backend webservers  # route to backend

backend webservers
    balance roundrobin
    server web1 10.0.0.1:80 check
```

Resulting AST (simplified):
```
HaproxyDocument {
  sections: [
    HaproxySection {
      type: 'frontend',
      name: 'http-in',
      mode: undefined,
      directives: [
        { keyword: { value: 'bind' }, args: [{ value: '*:80' }] },
        { keyword: { value: 'default_backend' }, args: [{ value: 'webservers' }] }
      ]
    },
    HaproxySection {
      type: 'backend',
      name: 'webservers',
      mode: undefined,
      directives: [
        { keyword: { value: 'balance' }, args: [{ value: 'roundrobin' }] },
        { keyword: { value: 'server' }, args: [{ value: 'web1' }, { value: '10.0.0.1:80' }, { value: 'check' }] }
      ]
    }
  ],
  parseErrors: []
}
```

---

## Known Limitations

- Multi-word directive "keywords" (e.g. `option httplog`, `tcp-request connection accept`) are treated as single-keyword + args. Completion and validation work at the top-level keyword only (`option`, `tcp-request`). Sub-keyword completion is a planned enhancement.
- `acl` lines are parsed as directives but ACL expressions are not semantically validated in v0.x.
- Continuation lines use the final merged line's index for all tokens — individual argument ranges in continued lines may be slightly off.

# HAProxy Domain Reference

A concise reference for the HAProxy concepts modeled in this extension. Useful for understanding validation rules, section semantics, and directive scope decisions.

---

## Config File Format

```haproxy
# Global process settings
global
    daemon
    maxconn 50000
    log 127.0.0.1 local0

# Inherited defaults for all proxies
defaults
    mode http
    timeout connect 5s
    timeout client  30s
    timeout server  30s
    option httplog

# Listen for incoming traffic
frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/ssl/haproxy.pem
    default_backend app-servers

# Define backend server pool
backend app-servers
    balance roundrobin
    server web1 10.0.0.1:8080 check
    server web2 10.0.0.2:8080 check
```

**Formatting rules:**
- Section headers at **column 0**, no leading whitespace.
- Directives indented (any whitespace; normalized to 4 spaces by the formatter).
- Comments: `#` to end of line. Inline comments are valid. `#` inside quoted strings is not a comment.
- Line continuation: trailing `\` joins with the next line.
- Quoted strings support `\"` and `\\` escape sequences.

---

## Sections

| Section | Purpose | Has name? |
|---------|---------|-----------|
| `global` | Process-level settings | No |
| `defaults` | Default values inherited by all proxies | No |
| `frontend` | Accepts incoming connections, routes to backends | Yes |
| `backend` | Pool of upstream servers with load balancing | Yes |
| `listen` | Combined frontend + backend (legacy / simple use) | Yes |
| `userlist` | User/group definitions for authentication | Yes |
| `peers` | State table synchronization between HAProxy instances | Yes |
| `resolvers` | DNS resolver configuration | Yes |
| `mailers` | Email alert configuration | Yes |
| `ring` | Ring buffer for asynchronous log forwarding | Yes |
| `log-forward` | Forward logs to remote syslog | Yes |
| `program` | External program management | Yes |
| `http-errors` | Custom HTTP error response pages | Yes |
| `cache` | HTTP response cache configuration | Yes |

---

## Proxy Section Matrix (D/F/L/B)

Many directives are valid in some but not all of the four proxy sections: **D**efaults, **F**rontend, **L**isten, **B**ackend. The extension models this with `SectionMatrix`.

| Symbol | Defaults | Frontend | Listen | Backend |
|--------|----------|----------|--------|---------|
| `ALL_PROXY` / `DFLB` | ✓ | ✓ | ✓ | ✓ |
| `DLB` | ✓ | ✗ | ✓ | ✓ |
| `DFL` | ✓ | ✓ | ✓ | ✗ |
| `FL` | ✗ | ✓ | ✓ | ✗ |
| `LB` | ✗ | ✗ | ✓ | ✓ |
| `FLB` | ✗ | ✓ | ✓ | ✓ |

Examples:
- `balance` → `DLB` (valid in defaults, listen, backend — not frontend)
- `use_backend` → `DFL` (valid in defaults, frontend, listen — not backend)
- `bind` → `FL` (frontend and listen only)
- `server` → `LB` (listen and backend only)
- `option httplog` → `ALL_PROXY`

---

## Mode

HAProxy sections operate in either **HTTP mode** or **TCP mode**.

```haproxy
frontend my-fe
    mode http    # or: mode tcp
```

Mode can be declared per-section or inherited from `defaults`. The extension tracks mode per section and uses it for validation:

- **HTTP-only directives** (`httpOnly: true`): trigger an error in TCP mode sections.
  - Examples: `option httplog`, `http-request`, `redirect`, `stats uri`
- **TCP-only directives** (`tcpOnly: true`): trigger an error in HTTP mode sections.
  - Examples: `tcp-request connection`, `persist rdp-cookie`

---

## Versioning

HAProxy follows a predictable release cadence. The extension supports:

| Version | Status | Notes |
|---------|--------|-------|
| 2.4 | LTS (EOL 2026) | Widely deployed, `reqrep`/`rsprep` already removed |
| 2.6 | LTS | Common in enterprise |
| 2.8 | LTS | Current recommended LTS |
| 3.0 | Stable | First 3.x release |
| 3.1 | Stable | Default version in the extension |

**Deprecation vs. Removal:**
- **Deprecated** (`deprecated` field): the directive still works in HAProxy but triggers a warning in the extension. Users should migrate.
- **Removed** (`removed` field): the directive causes HAProxy to fail on load. The extension raises an error.

---

## Key Validation Rules

| Rule | Severity | Trigger |
|------|----------|---------|
| Unknown directive | Error | Name not in registry for current version |
| Removed directive | Error | `removed` ≤ current version |
| Directive in wrong section | Error | Section type not in directive's `sections` |
| HTTP-only in TCP section | Error | `httpOnly: true` + section `mode: 'tcp'` |
| TCP-only in HTTP section | Error | `tcpOnly: true` + section `mode: 'http'` |
| Deprecated directive | Warning | `deprecated` ≤ current version |
| Directive outside section | Error | From parser — line before any section header |

---

## HAProxy Version History (Key Changes)

### 2.4
- **Removed:** `reqrep`, `rsprep`, `reqadd`, `rspadd`, `reqdel`, `rspdel`, `reqsetbe` — replaced by `http-request`/`http-response` actions
- **Added:** `http-after-response`, improvements to `http-request`/`http-response`

### 2.6
- **Added:** `tcp-request session` actions, QUIC/HTTP/3 support directives, enhanced `log-format` variables

### 2.8
- **Added:** `bind quic4@`, enhanced `tune.h2.*` parameters, `harden.reject-privileged-ports.*`

### 3.0
- First 3.x release — no breaking changes to validated directive set

### 3.1
- **Added:** `ocsp-update.*` directives, enhanced ring buffer support, `prealloc-fd`

---

## Common Config Patterns

### Basic HTTP load balancer

```haproxy
defaults
    mode http
    timeout connect 5s
    timeout client  30s
    timeout server  30s
    option httplog

frontend http
    bind *:80
    default_backend app

backend app
    balance roundrobin
    option httpchk GET /health
    server s1 10.0.0.1:80 check
    server s2 10.0.0.2:80 check
```

### SSL termination

```haproxy
frontend https
    bind *:443 ssl crt /etc/ssl/cert.pem
    mode http
    http-request redirect scheme https if !{ ssl_fc }
    default_backend app
```

### ACL-based routing

```haproxy
frontend http
    bind *:80
    acl is_api path_beg /api/
    use_backend api-servers if is_api
    default_backend web-servers
```

### TCP proxy

```haproxy
frontend mysql-in
    bind *:3306
    mode tcp
    default_backend mysql-servers

backend mysql-servers
    mode tcp
    balance leastconn
    server db1 10.0.0.1:3306 check
```

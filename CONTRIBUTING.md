# Contributing to HAProxy Config

Thank you for contributing. This document covers how to set up the project, run tests, and submit changes.

## Development Setup

**Requirements:**
- Node.js 24.x LTS
- VS Code 1.110.0+
- Git

```bash
git clone https://github.com/gmm/gmm-haproxy-vscode
cd gmm-haproxy-vscode
npm install
npm install --prefix client
npm install --prefix server
npm run compile
```

Press `F5` in VS Code to launch an **Extension Development Host** with the extension loaded. Open any `.cfg` file to activate it.

## Project Structure

```
client/src/extension.ts        — Thin VSCode client: starts the language server
server/src/server.ts           — LSP server entry point
server/src/parser/             — HAProxy config parser → typed AST
server/src/registry/           — Directive definitions per HAProxy version
server/src/validation/         — Diagnostic rules
server/src/completion/         — Autocompletion provider
server/src/hover/              — Hover documentation provider
server/src/formatting/         — Document formatter
server/src/data/               — Per-version directive JSON files (2.4–3.1)
syntaxes/                      — TextMate grammar
snippets/                      — Snippet definitions
test/                          — Unit and integration tests
```

## Scripts

| Command | Description |
|---|---|
| `npm run compile` | TypeScript type-check (no emit) |
| `npm run build` | Bundle with esbuild (required before packaging) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only (parser, validator) |
| `npm run watch` | Watch mode for development |
| `npm run package` | Build `.vsix` package |

## Making Changes

### Adding a new HAProxy directive

1. Add the definition to `server/src/registry/versionRegistry.ts` in `BASELINE_DIRECTIVES`.
2. Set the correct `sinceVersion`, `sections`, `signature`, and `description`.
3. If the directive was deprecated or removed, set `deprecatedSinceVersion` / `removedInVersion`.
4. Add a test in `test/validator/validator.test.ts` covering valid and invalid usage.

### Adding a new validation rule

1. Create a rule function in `server/src/validation/rules/`.
2. Import and apply it in `ValidationProvider.validateDirective()`.
3. Add a test fixture and unit test.

### Updating the TextMate grammar

1. Edit `syntaxes/haproxy.tmLanguage.json`.
2. Test against `test/fixtures/*.cfg` — all tokens should highlight as expected.
3. Test with VS Code high-contrast themes.

## Commit Convention

Format: `type(scope): description`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code change without behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `chore` | Build, deps, config |

Examples:
```
feat(completion): add context-aware backend name suggestions
fix(parser): handle continuation lines with CRLF endings
test(validator): add coverage for 2.4 removed directives
```

## Pull Request Guidelines

- One logical change per PR.
- All checks must pass: `npm run lint`, `npm run compile`, `npm test`.
- Include a description of what changed and why.
- Reference the issue number if applicable: `Closes #42`.
- New directives require tests. New validation rules require tests.

## Reporting Issues

Open an issue at [github.com/gmm/gmm-haproxy-vscode/issues](https://github.com/gmm/gmm-haproxy-vscode/issues) with:
- VS Code version
- Extension version
- HAProxy version selected
- The config snippet that triggers the issue (sanitized)
- Expected vs actual behavior

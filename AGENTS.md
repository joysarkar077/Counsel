<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENTS.md — Coding Conventions

Scope: code style/conventions only. Architecture (App Router, feature-based
structure, from-scratch crypto in `lib/crypto/`) is fixed — do not suggest
replacing hand-rolled crypto with libraries.

## TypeScript
- `strict: true`. No `any` without a `// TODO(reason):` comment.
- `type` for data shapes; `interface` for class contracts/merging.
- Explicit return types on all exported functions.
- `readonly` on arrays/objects that shouldn't mutate (esp. key material).

## Naming
- Files: `kebab-case.ts` for new files (don't mass-rename existing).
- `camelCase` vars/functions, `PascalCase` types/classes, `SCREAMING_SNAKE_CASE` for spec-fixed constants.
- Crypto primitives keep their spec names (RFC's `T0` stays `T0`, not `startTime`).
- Booleans read as predicates: `isValidSignature`, not `validSig`.
- No contributor names/tags in code or filenames — use git history.

## Functions
- One responsibility per function. Short enough to read on one screen.
- Guard clauses over nested conditionals.
- `lib/crypto/*` functions are pure: no I/O, no env reads, no `Math.random()` (use the designated CSPRNG).
- Avoid boolean-parameter traps — use an options object with named fields instead.

## Error Handling
- No empty `catch {}`.
- Expected failures (bad credentials, expired token) → typed `Result<T,E>` return, not throw.
- Unexpected failures (DB down, malformed key) → throw, caught at route/action boundary.
- API/Server Action responses: consistent `{ success, data?, error? }` shape. Never leak raw crypto error messages to the client.
- Secret comparisons (hashes, tokens, HMACs, signatures) → `crypto.timingSafeEqual`, never `===`.

## Comments
- Comment *why*, not *what*. No commented-out code in commits.
- Every `lib/crypto/*` function: doc comment citing the spec section it implements and any deviation from spec.
- `// TODO(who/issue#): what`.

## Imports & Module Boundaries
- No deep imports across feature folders. Shared UI → `components/`; shared logic → `lib/`.
- `lib/crypto/*` never imports from `lib/db` or `lib/models` — stays framework/storage-agnostic.
- `@/` alias outside current folder; relative imports within a feature folder only.

## Types Directory
- All TypeScript interfaces and shared types live in `src/types/`, one file per domain (e.g. `src/types/user.ts`, `src/types/case.ts`).
- Model files (`src/models/*.ts`) import their document interface from `src/types/` and re-export it for convenience — they do not define interfaces inline.
- Component prop types (`<ComponentName>Props`) stay colocated in their component file unless shared across multiple components, in which case they move to `src/types/`.

## Component Decomposition
- `page.tsx` is wiring only: data fetch, auth/redirect, layout composition. No form logic, no multi-step state.
- All route-specific components should be placed in `src/components/`, grouped into separate folders for each page or module (e.g. `src/components/dashboard/cases/`). Generic UI primitives → `components/ui/`, no app logic inside.
- Split a component when it has >1 responsibility (render + edit + delete-confirm = 3 components), not by line count.
- Isolate `"use client"` to the smallest interactive leaf — don't make a whole tree client for one button.
- Presentational components take props only; no `fetch`/DB imports — data comes from a container/page.
- Props typed as `<ComponentName>Props` once >2–3 props.
- Smell threshold (not a hard rule): `page.tsx` >~100 lines or component >~200 lines → look for a seam.

## Modular Code Design
- File layout order: imports → types/constants → private helpers → public API.
- Split a module on mixed responsibility ("and" in its one-sentence description), not line count. `bignum.ts` = integer math only; `rsa.ts` = RSA only; workflows (`stateVerification.ts`) compose from primitives, don't reimplement them.
- Strict dependency direction, low→high: `bignum → rsa/ecc → stateVerification → app/api/*`, `hmac → kdf/totp → app/api/auth/*`. Lower layers never import higher ones.
- Compose small named functions instead of flag-branching one function (`useSalt: boolean` params invite insecure call sites).
- Don't force a shared interface across genuinely different algorithms (RSA vs ECC) — duplication beats a leaky abstraction. Extract shared helpers only for identical logic (e.g. constant-time compare → `lib/crypto/util.ts`).
- Smell threshold: `lib/crypto/*` file >~300 lines → look for a natural seam.

## Code Style
- `const` by default; `let` only for real reassignment. Don't mutate params — return new values.
- No magic numbers/strings — named constants with a spec/reason comment.
- Max ~3 levels of nesting.
- `map`/`filter`/`reduce` when clearer; plain loops when more readable (e.g. modexp) — clarity over "functional."
- No implicit coercion: `===`/`!==`, explicit conversions.
- Side effects (I/O, logging) at the outer edge (routes/actions); pure logic (crypto, validation) in the middle.

## Formatting
- Prettier + ESLint via pre-commit hook (husky + lint-staged) — no manual style debates.
- Single quotes, semicolons, 2-space indent, trailing commas, max line length 100.
- Long crypto expressions: break into named intermediate variables, not one dense line.

## Testing
- Every `lib/crypto/*` function has a test: RFC known-answer vectors where available (HMAC, TOTP), edge/boundary inputs (`bignum.ts`), and negative tests (tampered input must fail verification cleanly, not throw unrelated errors).
- Test names describe behavior (`"rejects a signature with a flipped bit"`), not `test4`.
- No inter-test ordering dependencies.

## Security-Specific
- Name secret-holding variables obviously (`rawPassword`, `plaintextSsn`) so they're never logged/returned by accident.
- No `console.log` of secrets/keys/tokens/decrypted PII, even in debugging.
- Let decrypted PII / key buffers go out of scope ASAP; don't hold them in module-level or long-lived vars.

## Commits
- Conventional commits: `feat(crypto): ...`, `fix(auth): ...`.
- One logical change per commit.
- PRs touching `lib/crypto/*` state which spec section changed.


<!-- END:nextjs-agent-rules -->

# Counsel — Secure Legal Case Management System
## Combined Design and Implementation Plan

**Scope:** This document merges the workflow/data design (System Design v2) with the cryptography implementation plan and task division. It reflects the crypto architecture (RSA + ECC built from scratch, HMAC, TOTP 2FA, RBAC, key management), the case lifecycle workflow layer, and the assignment of work across three people.

---

## Part I — System Design

### 1. Note on Google Sign-In

Google Sign-In is excluded from the graded system. The reasoning is that OAuth delegates authentication to Google, so no password exists for the system to salt or hash, and the two-factor check never actually runs for that user. Verifying a Google ID token also requires a library-based signature check, which conflicts with the requirement that all cryptographic algorithms be implemented from scratch. Google additionally returns name and email in plaintext through its API, bypassing the RSA-encryption-at-registration pipeline entirely.

If the team wants Google Sign-In visible in the UI for presentation purposes, a disabled "Sign in with Google (coming soon)" button is acceptable, as long as it is not wired to any real authentication logic. Everything else in this document assumes only the custom email/password plus TOTP flow.

### 2. Roles Overview

| Role        | How they get an account                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Super Admin | Pre-seeded, fixed account, created once via a seed script, not through the public registration form  |
| Admin       | Onboarded by the Super Admin or another Admin via an email invitation                                |
| Lawyer      | Onboarded via an email invitation sent by an Admin, optionally pre-assigned to a case at invite time |
| Client      | Self-registers via the public registration form                                                      |

### 3. Case Lifecycle (state machine)

```
[Client submits case request]
        │
        ▼
   PENDING_REVIEW ──(Admin rejects)──► REJECTED (inactive, no lawyer)
        │
   (Admin accepts + assigns lawyer(s))
        │
        ▼
      ACTIVE ───────────────────────────┐
        │                               │
   (Lawyer requests close)              │
        │                               │
        ▼                               │
  CLOSE_REQUESTED                       │
        │                               │
   (Admin approves)   (Admin declines) ─┘ (back to ACTIVE)
        │
        ▼
      CLOSED
```

**Rules:**
- A case only becomes visible or actionable for a lawyer once it reaches `ACTIVE` status, meaning admin-approved and lawyer-assigned.
- `REJECTED` cases remain visible to the client and Admin but are read-only and have no lawyer attached.
- Only Admin can move a case out of `CLOSE_REQUESTED`, either approving it to `CLOSED` or declining it back to `ACTIVE`.
- Multiple clients can be attached to one case. All of them see the same case, hearings, notes, and files, but not each other's private message threads with the lawyer.

### 4. Role Workflows (detailed)

#### 4.1 Client
1. Registers or logs in through the standard encrypted-PII registration flow, with a salted and hashed password and TOTP on login.
2. Creates a case request by filling in a title and description, which creates a case in `PENDING_REVIEW` status with no lawyer attached.
3. Sees a dashboard listing all cases they are attached to, each showing its status.
4. Inside a case, the client can view hearing details read-only, add notes visible to everyone attached to the case, upload files with an optional attached note, and comment on any note or file. Every note or file shows who added it, by name and role badge.
5. The client can message the assigned lawyer through a thread private to that client and the lawyer, even if other clients exist on the same case. Clients cannot see other clients' message threads.

#### 4.2 Lawyer
1. Is onboarded through an email invitation from Admin and sets a password on first login, still going through the same encrypted registration pipeline internally.
2. Sees a dashboard with summary stat cards for Active, Close-Requested, and Closed case counts.
3. Has an Active Cases menu listing only cases currently assigned and active.
4. Inside a case, the lawyer can update case status and details, add or update hearing details, add notes, upload files, and request case closure, which moves the case to `CLOSE_REQUESTED` pending Admin approval.
5. Because a case can have multiple clients, the lawyer sees separate message threads per client, switchable through a tab or dropdown.

#### 4.3 Admin
1. Is created by the Super Admin or another Admin via email invitation, using the same mechanism as lawyer invitations but with the admin role.
2. The Super Admin is one fixed, seeded account not created through the invite flow, used to bootstrap the first real Admins.
3. The Admin dashboard has menus for Requested Cases (all `PENDING_REVIEW` cases, with Accept/Reject actions), Active Cases, and All Cases regardless of status.
4. Inside any case, Admin has the same capabilities as a lawyer, plus the ability to approve or decline close requests, reassign lawyers, and onboard new Admins or Lawyers.
5. Admin access to sensitive case content, such as client PII or messages, is still logged in the audit trail even though Admin has permission, for accountability rather than restriction.

#### 4.4 Comments and Notifications (all roles)
- Any role attached to a case can comment on any note or uploaded file.
- A comment triggers a notification to the original author of that item plus anyone who previously commented on it.
- Notifications are shown through a bell icon with an unread count, and clicking marks the notification read and deep-links to the relevant item.
- Poll-based notifications, fetched on page load and on periodic refresh, are sufficient for the project timeline. Real-time push through WebSockets is a nice-to-have, not a requirement.

### 5. API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-2fa
POST   /api/auth/logout
POST   /api/auth/invitations/:token/accept    -- lawyer/admin sets password on first login
```

**Admin onboarding**
```
POST   /api/admin/invitations                 -- send invite (email, role, optional caseId)
GET    /api/admin/invitations                  -- list sent invitations and their status
```

**Cases**
```
POST   /api/cases                              -- client creates a case request
GET    /api/cases                              -- role-scoped list (own / assigned / all+filter)
GET    /api/cases/:id
PATCH  /api/cases/:id                          -- edit details (lawyer/admin)
POST   /api/cases/:id/accept                   -- admin: assign lawyer(s), -> ACTIVE
POST   /api/cases/:id/reject                   -- admin: -> REJECTED
POST   /api/cases/:id/request-close             -- lawyer: -> CLOSE_REQUESTED
POST   /api/cases/:id/approve-close             -- admin: -> CLOSED
POST   /api/cases/:id/decline-close             -- admin: -> ACTIVE
PATCH  /api/cases/:id/lawyers                  -- admin: add/remove/reassign lawyers
```

**Hearings**
```
POST   /api/cases/:id/hearings
GET    /api/cases/:id/hearings
PATCH  /api/hearings/:id
```

**Notes**
```
POST   /api/cases/:id/notes
GET    /api/cases/:id/notes
```

**Files**
```
POST   /api/cases/:id/files                    -- upload (chunked, encrypted)
GET    /api/cases/:id/files
GET    /api/files/:id/download
```

**Comments**
```
POST   /api/comments                           -- { entityType, entityId, content }
GET    /api/comments?entityType=&entityId=
```

**Messages**
```
GET    /api/cases/:id/messages/:clientId       -- lawyer passes clientId; client omits or defaults to self
POST   /api/cases/:id/messages/:clientId
```

**Notifications**
```
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
```

**Audit and keys**
```
GET    /api/audit                              -- admin only
POST   /api/keys/rotate
```

This list is a working draft. Add or rename routes as the actual framework routing conventions require, but every workflow action from Section 4 now has a home.

### 6. Updated Data Model

```
users            { ...same as before..., role: client|lawyer|admin|super_admin }

invitations      { email, role (lawyer|admin), caseId (optional, lawyer only),
                    tokenHash, invitedBy, status (pending|accepted|expired), expiresAt }

cases            { title_enc, description_enc, status (pending_review|active|rejected|
                    close_requested|closed), clientIds: [userId...], lawyerIds: [userId...],
                    createdBy, signature, mac, createdAt, updatedAt }

hearings         { caseId, date, comments_enc, status (scheduled|completed|adjourned|cancelled),
                    updatedBy, mac, createdAt }

case_notes       { caseId, authorId, authorRole, content_enc, mac, createdAt }

case_files       { caseId, uploaderId, uploaderRole, fileNameEnc, fileBlobEnc (ECIES-encrypted
                    in chunks via GridFS, see Section 9), attachedNote_enc (optional),
                    mac, createdAt }

comments         { entityType (note|file), entityId, authorId, authorRole, content_enc,
                    mac, createdAt }

messages         { caseId, clientId, lawyerId, senderId, receiverId, bodyEnc, signature,
                    mac, readAt, createdAt }
                    -- one thread is keyed by (caseId, clientId, lawyerId), so a
                    -- multi-client case naturally has one distinct thread per client

notifications    { recipientId, type (comment|status_change|case_assigned|close_approved|...),
                    relatedEntityType, relatedEntityId, message (generic, see Section 8),
                    isRead, createdAt }

keys             { ...same as before... }
sessions         { ...same as before... }
audit_logs       { ...same as before..., now also logging case status changes,
                    admin content access, invitation sends/acceptances }
```

### 7. Encryption Assignment for New Entities

| Field                                      | Algorithm                | Reason                                                                   |
| ------------------------------------------ | ------------------------ | ------------------------------------------------------------------------ |
| `cases.title_enc`, `cases.description_enc` | ECC / ECIES              | Bulk content, same treatment as the original case content                |
| `hearings.comments_enc`                    | ECC / ECIES              | Bulk content                                                             |
| `case_notes.content_enc`                   | ECC / ECIES              | Bulk content                                                             |
| `case_files.fileNameEnc`, `fileBlobEnc`    | ECC / ECIES, chunked     | Bulk content, chunked for large payloads                                 |
| `case_files.attachedNote_enc`              | ECC / ECIES              | Bulk content                                                             |
| `comments.content_enc`                     | ECC / ECIES              | Bulk content                                                             |
| `messages.bodyEnc`                         | ECC / ECIES              | Bulk content                                                             |
| `messages.signature`                       | RSA sign/verify          | Non-repudiation: proves who sent the message, not just who could read it |
| `invitations.tokenHash`                    | HMAC over a random token | Verification only, not confidentiality; see Section 10                   |
| All record-level `mac` fields              | HMAC                     | Tamper detection on the stored ciphertext                                |

This follows the same split used everywhere else in the system: ECC handles bulk content encryption and RSA is reserved for identity, signatures, and key-wrapping.

### 8. Notification Content Rule

A notification such as "New comment on case: Divorce Settlement — Smith" would leak the case title in what could be plaintext, which conflicts with the requirement that all critical data stay encrypted at rest. The fix is that `notifications.message` should store a generic, role-agnostic template with no case title, note content, or message excerpt, for example "New comment on an item in one of your cases." The notification carries only `relatedEntityType` and `relatedEntityId` as pointers. When the user clicks through, the client fetches and decrypts the actual case or item content the normal way, using the permissions the user already has.

### 9. File Storage Decision

Encrypted file blobs are stored inside MongoDB using GridFS, since the content is already ciphertext from ECIES chunked encryption and does not need a separate object-storage service. To keep this manageable on a one-to-two week timeline, uploads should be capped at a fixed maximum size, for example a few megabytes per file, enforced both client-side and server-side before the chunking/encryption step runs.

### 10. Invitation Token Scheme

An invitation token is generated as random bytes (a randomness primitive, not an encryption operation, so it does not conflict with the from-scratch requirement). Only `tokenHash = HMAC(token, serverSecret)` is stored in the `invitations` collection; the raw token is sent solely through the invitation email link and never persisted in plaintext. When the invited user opens the link, the server recomputes the HMAC over the submitted token and compares it to the stored hash using a constant-time comparison, the same pattern used for password verification. Invitations expire after a fixed window and move to `expired` status if unused.

### 11. RBAC Matrix

| Action                         | Client           | Lawyer                   | Admin              | Super Admin        |
| ------------------------------ | ---------------- | ------------------------ | ------------------ | ------------------ |
| Register/login                 | Yes (self)       | Via invite only          | Via invite only    | Pre-seeded         |
| Create case request            | Yes              | No                       | No                 | No                 |
| Accept/reject case request     | No               | No                       | Yes                | Yes                |
| Assign/reassign lawyer(s)      | No               | No                       | Yes                | Yes                |
| View case (if attached)        | Yes              | Yes                      | Yes (all)          | Yes (all)          |
| Add note / upload file         | Yes              | Yes                      | Yes                | Yes                |
| Update hearing details         | No (view only)   | Yes                      | Yes                | Yes                |
| Update case status             | No               | Request close only       | Yes (full control) | Yes                |
| Approve/decline close request  | No               | No                       | Yes                | Yes                |
| Message assigned lawyer/client | Yes (own thread) | Yes (per-client threads) | View only (logged) | View only (logged) |
| Comment on notes/files         | Yes              | Yes                      | Yes                | Yes                |
| Onboard new Admin              | No               | No                       | Yes                | Yes                |
| Onboard new Lawyer             | No               | No                       | Yes                | Yes                |
| View audit log                 | No               | No                       | Yes                | Yes                |

### 12. UI / Page Map per Role

**Client**
```
/login
/register
/verify-2fa
/dashboard                     -> list of own cases with status badges + "New Case Request" button
/cases/new                     -> case request form
/cases/:id                     -> tabs: [Overview] [Hearings] [Notes & Files] [Message Lawyer]
```

**Lawyer**
```
/login (via invite, sets password first time)
/verify-2fa
/dashboard                     -> summary cards (Active / Close-Requested / Closed counts)
/cases/active                  -> list of active cases assigned to this lawyer
/cases/:id                     -> tabs: [Overview] [Hearings — editable] [Notes & Files] [Messages]
```

**Admin (and Super Admin)**
```
/login
/verify-2fa
/dashboard                     -> menu: [Requested Cases] [Active Cases] [All Cases] [Manage Admins/Lawyers] [Audit Log]
/cases/requested
/cases/active
/cases/all
/cases/:id
/admin/invite
/audit
```

### 13. Decisions Needed From the Team

These are silent assumptions in the design that should be confirmed by the team rather than locked in by default:

1. **Single lawyer or multiple lawyers per case.** The schema uses `lawyerIds` as an array for flexibility. If a case always has exactly one lawyer, switch to a single `lawyerId` field to simplify the messaging logic and save build time.
2. **Message history on lawyer reassignment.** The suggested approach keeps the old thread read-only and starts a fresh thread with the new lawyer, avoiding re-encryption of old messages under a new key.
3. **Exact hearing status values.** Confirm whether the set is `Scheduled`, `Completed`, `Adjourned`, `Cancelled`, or something else, so the UI dropdown matches what Admin and Lawyer actually need.
4. **Rejected cases are read-only for the client.** This was assumed, not stated, and should be confirmed.
5. **All clients on a multi-client case have equal permissions.** Assumed that any client can add notes or files, not just the one who created the case request.
6. **Rejection reason.** Decide whether rejected clients get a reason along with the status change, which would require a `rejectionReason_enc` field on `cases`.

---

## Part II — Algorithm Implementation Plan and Task Division

### 14. Guideline Compliance Summary

| Guideline requirement                                    | Where it is satisfied                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Login and Registration modules                           | Section 4, Part I                                                          |
| Encrypted user info (username, email, contact)           | RSA encryption on all PII fields                                           |
| Hashed and salted passwords                              | Custom KDF, Section 17                                                     |
| Two-step authentication                                  | Password plus TOTP, Section 18                                             |
| Key Management Module (generate/distribute/store/rotate) | Referenced in Part I data model and RBAC                                   |
| Encrypted posts (cases) and profile CRUD                 | ECC-encrypted case content, RSA-encrypted profile fields                   |
| All critical data encrypted at rest                      | Users, cases, notes, messages, keys, all stored as ciphertext              |
| MAC (HMAC) for integrity                                 | Section 17, applied to every stored record                                 |
| Only asymmetric encryption, no symmetric ciphers         | RSA and ECC only, throughout                                               |
| Two distinct asymmetric algorithms, different jobs       | RSA for identity/signatures/key-wrap, ECC for bulk content                 |
| RBAC                                                     | Client / Lawyer / Admin, Section 11                                        |
| Secure session management                                | NextAuth (Auth.js) securely encrypted JWE cookies                          |
| All algorithms implemented from scratch                  | No `crypto.publicEncrypt`/`sign`/`createHmac`, no npm crypto libraries     |

### 15. Number Theory Foundation (`bignum.ts`)

Required by both RSA and ECC.

**What to build:**
1. `modExp(base, exponent, modulus)`, modular exponentiation via square-and-multiply
2. `modInverse(a, m)`, via the Extended Euclidean Algorithm
3. `isProbablePrime(n)`, Miller-Rabin primality test
4. `generateLargePrime(bits)`, randomly generate candidates and test with Miller-Rabin until one passes

**Reference links:**
- Extended Euclidean Algorithm and modular inverse background: https://dzone.com/articles/implementing-rsa-in-python-from-scratch
- Miller-Rabin and large prime generation: https://dzone.com/articles/implementing-rsa-from-scratch-in-python-part-2
- Full worked repo with all four primitives (Python, algorithms translate directly to TypeScript): https://github.com/msmrexe/python-rsa-from-scratch

### 16. RSA (`rsa.ts`)

**Key generation:**
1. Generate two large random primes `p`, `q` using `generateLargePrime`
2. Compute `n = p * q`
3. Compute `φ(n) = (p-1)(q-1)`
4. Choose public exponent `e`, commonly `65537`, and check `gcd(e, φ(n)) = 1`
5. Compute private exponent `d = modInverse(e, φ(n))`
6. Public key is `(e, n)`, private key is `(d, n)`

**Encryption:** `ciphertext = modExp(plaintextBlock, e, n)`
**Decryption:** `plaintextBlock = modExp(ciphertext, d, n)`

Since plaintext such as usernames and emails is longer than one block, split it into blocks smaller than `n`, encrypt each block separately, and store as an array or concatenated buffer.

**Digital signature:**
- Sign: `signature = modExp(hash(message), d, n)`, hashing first, using an own SHA-256 implementation or the built-in hash primitive only, not encryption
- Verify: `recovered = modExp(signature, e, n)`, then check `recovered === hash(message)`

**Reference links:**
- Step-by-step keygen/encrypt/decrypt: https://medium.com/@2303a51l45/implementing-the-rsa-algorithm-a-step-by-step-guide-2792c182190e
- Encrypt/decrypt with worked Python code: https://dzone.com/articles/implementing-rsa-in-python-from-scratch
- Digital signature flow, sign plus verify, step by step: https://medium.com/@emrehangorgec/implementing-rsa-for-digital-signature-from-scratch-f6f416d9878f
- Group theory background: https://sahandsaba.com/cryptography-rsa-part-1.html
- Reference implementation with Miller-Rabin, Karatsuba, and Extended Euclidean in one place: https://github.com/msmrexe/python-rsa-from-scratch

### 17. ECC (`ecc.ts`)

**Curve setup:** use a known, documented curve, `secp256k1` recommended, and do not invent a custom curve.

**Point arithmetic to implement:**
1. `pointAdd(P, Q)`, adding two distinct points on the curve
2. `pointDouble(P)`, adding a point to itself via the tangent line method
3. `scalarMultiply(k, P)`, repeated doubling and adding to compute `k·P`

**Key generation:**
1. Private key `d` is a random integer in `[1, n-1]`, where `n` is the curve order
2. Public key `Q = d · G`, where `G` is the curve's base point

**ECIES-style encryption (hybrid, still fully asymmetric):**
1. Generate an ephemeral keypair `(r, R = r·G)`
2. Compute the shared point `S = r · Q_recipient` via ECDH
3. Derive a keystream from `S` using a hash-based expansion, for example repeatedly hashing `S.x ‖ counter` with SHA-256 to produce enough bytes
4. Ciphertext is `plaintext XOR keystream`
5. Send `(R, ciphertext)` to the recipient

**ECIES decryption:**
1. The recipient computes `S' = d_recipient · R`, the same shared point by ECDH symmetry
2. Derive the same keystream from `S'`
3. `plaintext = ciphertext XOR keystream`

**ECDSA (used for signatures):**
- Sign: pick random `k`, compute `R = k·G`, `r = R.x mod n`, `s = k⁻¹(hash(message) + r·d) mod n`, signature is `(r, s)`
- Verify: using the signer's public key `Q`, recompute a point from `(r, s, hash(message))` and check it matches `r`

**Reference links:**
- Full ECC-from-scratch walkthrough: https://medium.com/@abhiveerhome/building-elliptic-curve-cryptography-ecc-from-scratch-7b28e3b27531
- Working reference implementation with test cases: https://github.com/mcxxmc/simple-implementation-ecc
- Conceptual explanation of ECC, ECIES, and ECDH with runnable secp256k1 examples: https://cryptobook.nakov.com/asymmetric-key-ciphers/elliptic-curve-cryptography-ecc
- Companion GitHub markdown version: https://github.com/nakov/practical-cryptography-for-developers-book/blob/master/asymmetric-key-ciphers/elliptic-curve-cryptography-ecc.md
- A minimal, fast, from-scratch secp256k1 implementation in JavaScript: https://paulmillr.com/posts/noble-secp256k1-fast-ecc/

### 18. HMAC and Password KDF (`hmac.ts`, `kdf.ts`)

**HMAC construction (RFC 2104):**
1. If the key is longer than the hash block size, hash it down first
2. Pad the key to block size with zero bytes
3. `ipad = key XOR (0x36 repeated)`, `opad = key XOR (0x5c repeated)`
4. `HMAC = Hash(opad ‖ Hash(ipad ‖ message))`

SHA-256 is used as the inner hash, which is allowed as a primitive since the HMAC construction itself is being built from scratch, not the underlying hash function or `crypto.createHmac`.

**Verification:** recompute the HMAC over the retrieved ciphertext and compare it to the stored value using a constant-time comparison, written as a byte-by-byte compare rather than `===` on secrets.

**Password KDF (a custom PBKDF-style loop):**
1. Generate a random salt per user, for example 16 bytes via `crypto.randomBytes`, used only for randomness, not encryption
2. `hash = SHA256(password ‖ salt)`
3. Repeat step 2 a fixed number of times, for example 10,000 iterations, feeding each result back in to slow down brute-force attempts
4. Store `(hash, salt)`, and verify login by repeating the same process and comparing

**Reference links:**
- Canonical HMAC specification with exact padding and construction steps: https://www.rfc-editor.org/rfc/rfc2104
- Explanation of why HMAC is built this way, including the length-extension attack it defends against: https://blog.gitguardian.com/hmac-secrets-explained-authentication/

### 19. TOTP / 2FA (`totp.ts`)

**HOTP (RFC 4226), base algorithm:**
1. `HS = HMAC-SHA1(secret, counter)`, with an 8-byte big-endian counter, or the team's own HMAC-SHA256 construction from Section 18 if the course allows deviating from SHA1
2. Dynamic truncation: take the low nibble of the last byte as an offset, extract 4 bytes starting there, and clear the top bit
3. `HOTP = truncatedValue mod 10^digits`, typically 6 digits

**TOTP (RFC 6238), time-based wrapper:**
1. `T = floor(currentUnixTime / 30)`, a 30-second step
2. `TOTP = HOTP(secret, T)`
3. To verify, allow a small window, for example checking `T-1, T, T+1`, to tolerate clock drift

**Reference links:**
- Line-by-line RFC 6238 walkthrough: https://laravelengineering.medium.com/building-totp-from-scratch-in-go-8320f2e0a9df
- Complete working implementation with standard-library primitives, directly portable to TypeScript: https://dev.to/ayinedjimi-consultants/implementing-totp-two-factor-authentication-from-scratch-in-python-4j9
- Official specs: https://www.rfc-editor.org/rfc/rfc6238.html and https://www.rfc-editor.org/rfc/rfc4226

### 20. Three-Person Task Division

**Principle:** each person owns one complete vertical slice, the algorithm and every feature that uses it, so nobody is stuck waiting on someone else's unfinished module. The only shared artifact is a short interface contract agreed on Day 1, function names and input/output shapes for `rsa.ts`, `ecc.ts`, and `hmac.ts`, so Person C can write code against those signatures before A and B finish, using stub functions later swapped for the real thing.

**Day 1 (all three together, about two hours): agree on contracts**
- Function signatures for `RSA.generateKeyPair()`, `RSA.encrypt()`, `RSA.decrypt()`, `RSA.sign()`, `RSA.verify()`
- Function signatures for `ECC.generateKeyPair()`, `ECC.encrypt()` (ECIES), `ECC.decrypt()`, `ECC.sign()` (ECDSA), `ECC.verify()`
- Function signatures for `HMAC.compute()`, `HMAC.verify()`, `KDF.hashPassword()`, `KDF.verifyPassword()`, `TOTP.generate()`, `TOTP.verify()`
- MongoDB schema finalized, per Section 6
- After this meeting, all three work independently

**Jotee Sarkar Joy, RSA plus Identity/Auth** (self-contained, since RSA covers identity, signatures, and key-wrapping)

| Day | Task                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------- |
| 1–2 | Build `bignum.ts` with unit tests                                                                          |
| 2–3 | Build `rsa.ts`, keygen, encrypt/decrypt, sign/verify, tested against the contract signatures               |
| 4   | Registration API, RSA-encrypt PII fields, generate the user's RSA keypair, store the encrypted private key |
| 5   | Login step one, credentials check, calling into Person C's `kdf.ts` once ready, stubbed until then         |
| 6   | RSA-signed case-status-change verification logic                                                           |
| 7   | Bug fixing, writing the RSA report section, and migrating UI/UX to Tailwind CSS v4 split-pane architecture |

**Sabid Mahmud, ECC plus Content** (self-contained, since ECC covers content encryption)

| Day | Task                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1–2 | Build `ecc.ts` point arithmetic on secp256k1, with unit tests                                                                    |
| 3   | ECC keygen and ECIES encrypt/decrypt, with unit tests                                                                            |
| 4   | ECDSA sign/verify, with unit tests                                                                                               |
| 5   | Cases module, create/view/edit with ECC-encrypted content and HMAC, calling Person C's `hmac.ts` once ready, stubbed until then  |
| 6   | Messages module, send/view, ECC-encrypted body with RSA signature, calling Person A's sign/verify once ready, stubbed until then |
| 7   | Session management, integrated via NextAuth (Auth.js)                                                                            |

**Farjana Sadia Prome, HMAC/KDF/TOTP plus Infrastructure/RBAC/Key Management/Audit** (fully independent low-level modules plus everything orchestrating A and B's output)

| Day | Task                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–2 | Build `hmac.ts` and `kdf.ts`, fully testable standalone with dummy byte arrays                                                                               |
| 2–3 | Build `totp.ts` on top of `hmac.ts`, testable against RFC 6238 test vectors                                                                                  |
| 3   | Next.js project scaffold, MongoDB connection, all collections created per schema                                                                             |
| 4   | RBAC middleware, the Client/Lawyer/Admin permission table                                                                                                    |
| 5   | Key Management module, calling `RSA.generateKeyPair()` and `ECC.generateKeyPair()` once available from A and B, to implement generate/store/rotate endpoints |
| 6   | Audit log, hash-chained entries, wiring audit calls into A's and B's endpoints                                                                               |
| 7   | Minimal frontend forms for all flows, so the whole system is demoable end-to-end                                                                             |

**Why this split avoids blocking:** A and B each build and fully unit-test their entire crypto module in isolation across Days 1 to 4, with no waiting required. C's lowest-level work needs nothing from A or B and can be tested with dummy inputs immediately. The only real hand-off points are the Day 1 interface agreement and the Day 5 to 6 point where C's Key Management and Audit modules call into A and B's already-finished, already-tested `generateKeyPair()` functions, which is a simple function call rather than a design dependency. If someone finishes early, they move into integration testing and bug-fixing on the shared repository rather than sitting idle.

### 21. All Features, in Plain English

**Signing up and logging in.** When someone creates a Counsel account, the system does not store their username, email, or phone number as plain readable text. It scrambles that information using RSA so that even a database breach would only reveal gibberish, not real personal details. Passwords are never stored as typed. Instead, the system mixes each password with a random salt and scrambles it through a one-way process many times over, so even the system itself cannot reverse it back into the original password. Logging in also requires a temporary six-digit code that changes every 30 seconds, so a stolen password alone is not enough to get in.

**Keeping the keys safe.** Every user has a personal pair of digital keys used to scramble and unscramble their information. These keys are generated automatically, stored in a protected form themselves, and can be rotated periodically or if there is ever a security concern, without breaking the rest of the system.

**Cases and case notes.** Lawyers can create legal cases, and both they and their assigned clients can view and update them. All case content, descriptions and notes, is scrambled before it is saved and unscrambled only for people allowed to see it. If anyone tampers with saved case data, the system can tell, because it keeps an HMAC fingerprint of the original scrambled data and checks it every time the case is opened.

**Messaging.** Clients and their lawyer can send messages about a specific case. Every message is scrambled before storage, digitally signed by whoever sent it, and checked for tampering the same way case content is. This makes it a private, tamper-evident inbox tied to each legal case.

**Roles and permissions.** Clients can view their own cases and message their lawyer. Lawyers can create and manage the cases they are assigned to. Administrators handle account management and can rotate security keys, but their access to sensitive content is separately logged so there is accountability even at the admin level.

**Staying logged in safely.** Once logged in, the system issues a signed, time-limited session pass instead of remembering the password. This pass expires after a while and is checked against details like the device or browser fingerprint, so a stolen or reused session from a different device can be caught and forces a fresh login.

**Keeping a record of everything.** Every important action, logging in, viewing a case, sending a message, rotating a key, is written into a tamper-evident activity log. Each entry is mathematically linked to the one before it, so a secret deletion or alteration of a past entry would break the chain and be detectable.

**The big picture.** Even in the worst case, someone stealing the entire database, they still could not read anyone's personal information, case details, or messages, because everything sensitive is scrambled with real cryptographic techniques rather than simply hidden, every scrambled piece of data has a tamper-detection fingerprint, and access to anything sensitive requires proving identity twice and having the right role.

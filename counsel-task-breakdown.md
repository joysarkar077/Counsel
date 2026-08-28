# Counsel — Secure Legal Case Management System
## Implementation Tasks, Subtasks, and Constraints

### Project Background & Core Idea
Counsel is a highly secure, cryptographic legal case management system designed with a zero-trust mindset regarding database breaches. The core idea is that even if an attacker steals the entire database, they cannot read personal information, case details, or messages. To achieve this, all sensitive data is encrypted at rest, every piece of data has a tamper-detection fingerprint (HMAC), and access requires role-based verification and Two-Factor Authentication (TOTP). Furthermore, all cryptographic algorithms—RSA, ECC, HMAC, and TOTP—must be built fundamentally from scratch rather than relying on standard cryptographic libraries for their core mathematical operations.

### General Constraints for the Entire Team
*   **No Third-Party Crypto Libraries:** All algorithms (RSA, ECC, HMAC, KDF, TOTP) must be implemented from scratch. You cannot use built-in features like `crypto.publicEncrypt`, `crypto.sign`, or `crypto.createHmac`.
*   **Non-Blocking Workflow:** The team must agree on a strict interface contract (function names, inputs, outputs) immediately. If someone's module is not ready, rely on stub functions to continue development without waiting.
*   **Cryptographic Division of Labor:** RSA is strictly reserved for identity, signatures, and key-wrapping. ECC is reserved for bulk content encryption and session signing.
*   **Notification Security:** Notifications must use generic templates (e.g., "New comment on an item in one of your cases") to prevent leaking plaintext PII or case titles.
*   **File Storage:** Encrypted file blobs must be chunked and stored inside MongoDB using GridFS, with strict size caps enforced.

---

## Jotee Sarkar Joy: Identity & Authentication Architect (RSA Module)

**Background & Idea:** 
Person A is responsible for the identity layer of the application. Since personal identifiable information (PII) like names and emails cannot be stored in plaintext, Person A will construct the RSA algorithm from the ground up to encrypt this data. They also ensure non-repudiation by digitally signing critical state changes (like when a lawyer updates a case status).

### Tasks & Subtasks
1.  **Number Theory Foundation (`bignum.ts`)**
    *   Implement modular exponentiation (square-and-multiply).
    *   Implement the Extended Euclidean Algorithm for modular inverse.
    *   Implement the Miller-Rabin primality test and a large prime generator.
2.  **RSA Implementation (`rsa.ts`)**
    *   Implement key generation (primes `p`, `q`, compute `n`, `e`, `d`).
    *   Implement block-based encryption and decryption.
    *   Implement digital signature signing and verification (hash and sign).
3.  **Registration API**
    *   Build the user registration flow.
    *   Encrypt all PII fields (username, email, contact) using RSA before storage.
    *   Generate the user's RSA keypair and securely store the encrypted private key.
4.  **Login Flow (Step One)**
    *   Implement the initial credentials check for the login flow.
    *   Interface with Person C's KDF module (using a stub if necessary) to verify hashed passwords.
5.  **State-Change Verification**
    *   Implement the RSA-signed case-status-change verification logic to ensure only authorized roles mutated the case state.

### Specific Constraints for Person A
*   **Block Sizes:** Because PII is often longer than a single RSA block, the plaintext must be correctly split into blocks smaller than `n`, encrypted separately, and concatenated.
*   **Prime Generation:** Random candidates must be tested with Miller-Rabin until passing; do not rely on pre-generated primes.
*   **Signatures:** Signatures must sign the *hash* of the message, not the raw message itself.

---

## Sabid Mahmud: Content & Session Guardian (ECC Module)

**Background & Idea:** 
Person B secures the bulk of the platform's data—the actual legal cases, notes, files, and messages. Because RSA is too slow for large payloads, Person B will implement Elliptic Curve Cryptography (ECC) from scratch. They will also manage secure, tamper-proof user sessions using ECDSA so users stay safely logged in without repeatedly entering passwords.

### Tasks & Subtasks
1.  **ECC Foundation (`ecc.ts`)**
    *   Implement elliptic curve point arithmetic (Point Addition, Point Doubling, Scalar Multiplication).
    *   Set up the standard `secp256k1` curve parameters.
2.  **ECIES (Encryption/Decryption)**
    *   Implement ECC key generation.
    *   Build hybrid ECIES encryption: generate an ephemeral keypair, compute shared point via ECDH, derive a keystream, and XOR with plaintext.
    *   Implement ECIES decryption.
3.  **ECDSA (Digital Signatures)**
    *   Implement ECDSA signing and verification algorithms.
4.  **Cases Module**
    *   Build the APIs/logic for creating, viewing, and editing cases.
    *   Encrypt all case content (titles, descriptions, notes) using ECIES.
    *   Integrate HMAC (from Person C) to ensure content integrity.
5.  **Messages Module**
    *   Build the messaging system between clients and lawyers.
    *   Encrypt message bodies using ECIES.
    *   Apply RSA signatures (calling Person A's module) to prove message authorship.
6.  **Session Management**
    *   Implement ECDSA-signed cookies.
    *   Develop session fingerprinting (e.g., tying sessions to devices/browsers) and expiry logic.

### Specific Constraints for Person B
*   **Curve Selection:** Strictly use the documented `secp256k1` curve; do not invent a custom curve.
*   **Key Derivation in ECIES:** Must use a hash-based expansion (e.g., repeatedly hashing the shared point with a counter) to produce a sufficient keystream for XOR operations.
*   **File Chunking:** Large case files must be chunked *before* encryption to manage memory and storage limits in GridFS.

---

## Farjana Sadia Prome: Infrastructure, Integrity & Orchestration Master (HMAC/TOTP/Keys)

**Background & Idea:** 
Person C lays down the foundational integrity and access-control mechanisms. They build the tamper-evident seals (HMAC) applied to every database record, the password hashing function (KDF), and the Two-Factor Authentication (TOTP). Furthermore, Person C is responsible for standing up the core infrastructure, enforcing Role-Based Access Control (RBAC), managing the lifecycle of the crypto keys generated by A and B, and maintaining a mathematically verifiable audit log.

### Tasks & Subtasks
1.  **HMAC & KDF Implementation (`hmac.ts`, `kdf.ts`)**
    *   Build HMAC from scratch following RFC 2104 specifications (using built-in SHA-256 is acceptable as the inner hash).
    *   Implement a custom PBKDF-style loop for password hashing (hashing a password and random salt thousands of times).
2.  **TOTP Implementation (`totp.ts`)**
    *   Build the HOTP base algorithm (RFC 4226) with dynamic truncation.
    *   Build the time-based wrapper (TOTP, RFC 6238) with a 30-second step window and drift tolerance.
3.  **Infrastructure & Database Scaffold**
    *   Set up the Next.js project and MongoDB connection.
    *   Create all necessary database collections following the agreed schema.
4.  **Role-Based Access Control (RBAC)**
    *   Implement RBAC middleware to strictly enforce the Client/Lawyer/Admin permission matrix.
5.  **Key Management Module**
    *   Build endpoints to generate, store, and rotate cryptographic keys.
    *   Orchestrate calls to A and B's key generation functions.
6.  **Audit Logging**
    *   Implement a hash-chained audit log for all critical actions (login, case views, key rotation).
    *   Ensure any tampering breaks the mathematical chain.
7.  **Frontend Orchestration**
    *   Build minimal frontend forms bridging all flows to ensure end-to-end demo capabilities.

### Specific Constraints for Person C
*   **Constant-Time Comparisons:** When verifying HMACs or password hashes, you must use byte-by-byte constant-time comparisons to prevent timing attacks; never use standard `===` on secrets.
*   **HMAC Padding:** Follow RFC 2104 exactly, ensuring proper zero-padding and XORing with `ipad` (0x36) and `opad` (0x5c).
*   **Password Iterations:** The KDF must iterate the hash function a fixed, high number of times (e.g., 10,000) to effectively slow down brute-force attacks.

# Counsel Authentication Architecture

Counsel implements a zero-trust, completely custom authentication flow. Following strict project constraints, no third-party cryptography or authentication libraries (like Auth.js or bcrypt) are used. Instead, all cryptographic primitives (HMAC, PBKDF2) are implemented from scratch using Node's native `crypto` or Web Crypto API.

This document details the complete lifecycle of authentication in the application.

---

## 1. User Identification (Blind Indexing)
Because Counsel is a zero-trust system, Personally Identifiable Information (PII) like names and emails are strictly RSA-encrypted in the database. However, to authenticate a user, the system must look them up by email.

To solve this without exposing the plaintext email, the system uses a **Blind Index**:
- During registration, the user's email is hashed using `generateEmailBlindIndex()` (an HMAC-SHA256 function keyed with `BLIND_INDEX_KEY`).
- During login, the submitted email is hashed using the exact same function.
- The database is queried using `User.findOne({ emailHash })`. This allows user lookup in O(1) time without the database ever storing the plaintext email.

## 2. Password Verification (Custom PBKDF2)
Passwords are never stored in plaintext. They are hashed using a custom implementation of **PBKDF2** (Password-Based Key Derivation Function 2) defined in `src/lib/crypto/kdf.ts`.

- **Hashing**: A 16-byte random salt is generated. The password and salt are run through `10,000` iterations of HMAC-SHA256.
- **Verification**: During login, the provided password is run through the same PBKDF2 derivation using the stored salt and iteration count.
- **Constant-Time Comparison**: The derived hash is compared against the stored hash using `constantTimeEqual()` (which wraps `crypto.timingSafeEqual`) to prevent timing side-channel attacks.

## 3. Two-Factor Authentication (OTP Phase)
Once the password is verified, the user is not immediately logged in. They enter the 2FA phase:

1. **Temporary Token**: A temporary, short-lived (10-minute) session token is generated. This token is signed with HMAC-SHA256 using `SERVER_SECRET` and stored in an HTTP-only cookie (`temp_auth_token`).
2. **OTP Generation**: A 6-digit OTP is generated. To prevent the database from holding the plaintext OTP, it is hashed with SHA-256 and stored in the user document as `otpHash` alongside an expiration timestamp.
3. **Email Delivery**: The plaintext OTP is emailed to the user via Nodemailer.
4. **Verification**: The user submits the OTP to `/api/auth/verify-2fa`. The system verifies the `temp_auth_token` signature, hashes the submitted OTP, and compares it to the stored `otpHash` in constant time.

## 4. Session Management
Upon successful 2FA verification, the temporary token is destroyed, and a full session is established.

- **Token Structure**: A JWT-style token is created (`header.payload.signature`).
- **Payload**: Contains `userId`, `role`, `iat` (issued at), and `exp` (expiration set to 24 hours).
- **Signature**: The payload is signed using HMAC-SHA256 with the `SERVER_SECRET`. *(Note: This will eventually be migrated to an ECDSA signature by the cryptography team).*
- **Storage**: The token is stored as an HTTP-only, secure, SameSite=Lax cookie (`session_token`), ensuring it is immune to Cross-Site Scripting (XSS) attacks.

## 5. Route Protection & RBAC (Edge Middleware)
All protected routes (both UI and API) are guarded by `src/middleware.ts`, which runs on the Edge runtime.

1. **Interception**: The middleware intercepts all traffic to `/dashboard/*` and protected `/api/*` routes.
2. **Validation**: It extracts the `session_token` cookie and verifies the HMAC signature using Web Crypto API (`crypto.subtle`).
3. **Header Injection**: If the signature is valid and the token is not expired, the middleware decodes the payload and injects `x-user-id` and `x-user-role` into the HTTP headers.
4. **Rejection**: If the token is missing, invalid, or tampered with, the middleware intercepts the request. API requests receive a `401 Unauthorized` JSON response, while UI requests are redirected to `/login`.
5. **Downstream Enforcement**: API routes like `src/app/api/cases/route.ts` consume the injected headers to enforce Role-Based Access Control (RBAC), ensuring that clients, lawyers, and admins can only perform actions authorized for their specific role.

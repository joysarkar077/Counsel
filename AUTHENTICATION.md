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

1. **Redirection**: The NextAuth `CredentialsProvider` intentionally throws a `2FA_REQUIRED` error upon successful password verification, halting the initial login. The UI catches this and redirects the user to `/verify-2fa?email={blind-indexed-email}`.
2. **OTP Generation**: A 6-digit OTP is generated during the first login step. To prevent the database from holding the plaintext OTP, it is hashed with SHA-256 and stored in the user document as `otpHash` alongside an expiration timestamp.
3. **Email Delivery**: The plaintext OTP is emailed to the user via Nodemailer.
4. **Verification**: The user submits the OTP to the second pass of the `CredentialsProvider` (with `is2FAPhase=true`). The system looks up the user via the email, hashes the submitted OTP, and compares it to the stored `otpHash` in constant time. If valid, NextAuth finalizes the sign-in.

## 4. Session Management (NextAuth / Auth.js)
Upon successful 2FA verification, the session is established using **NextAuth (Auth.js)**. 

- **Custom Credentials Provider**: The login flow uses a single `CredentialsProvider` that natively supports our two-step authentication process (checking PBKDF2 hashes first, then verifying the email OTP).
- **Session Strategy**: We use the standard NextAuth `jwt` strategy.
- **Payload Extraction**: NextAuth's `jwt` and `session` callbacks are customized to embed the `userId` and `role` securely inside the JWE token.

## 5. Route Protection & RBAC (NextAuth Edge Middleware)
All protected routes (both UI and API) are guarded by `src/middleware.ts`, utilizing NextAuth's official `withAuth` wrapper.

1. **Interception**: The middleware intercepts all traffic to `/dashboard/*` and protected `/api/*` routes.
2. **Validation**: NextAuth automatically verifies the session cookie and JWT validity. If invalid, the UI redirects to `/login` and API routes return `401 Unauthorized`.
3. **Header Injection (Backwards Compatibility)**: To ensure that the existing API routes do not break and can still enforce Role-Based Access Control (RBAC), the middleware manually intercepts the request before passing it down and injects `x-user-id` and `x-user-role` into the HTTP headers based on the decoded NextAuth token.
4. **Downstream Enforcement**: API routes like `src/app/api/cases/route.ts` seamlessly consume the injected headers, enforcing boundaries for clients, lawyers, and admins.

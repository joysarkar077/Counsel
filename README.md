<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/RSA-From_Scratch-navy?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ECC-From_Scratch-purple?style=for-the-badge" />
</div>

<br/>

<div align="center">
  <h1>Counsel</h1>
  <p><strong>Secure Legal Case Management System</strong></p>
  <p>A zero-trust, cryptographically hardened legal case management platform where every record is encrypted, every action is audited, and even a full database breach leaks nothing.</p>
</div>

---

## Overview

**Counsel** is a full-stack web application built for our CSE447 (Cryptography) semester project. It's a legal case management system built from the ground up with a **zero-trust** architecture. This means all sensitive data is encrypted at rest using our custom-built RSA and ECC implementations. Furthermore, every stored record has an HMAC tamper-detection fingerprint, and logging into the system requires both a password and a time-based two-factor code (TOTP).

> **The core constraint:** All cryptographic algorithms (RSA, ECC, HMAC, KDF, and TOTP) are implemented **from scratch** in TypeScript. We did not use any third-party cryptographic libraries for the core operations.

---

## Features

### Identity & Authentication
- **RSA-Encrypted PII:** Usernames, emails, and phone numbers are encrypted with a user-specific RSA keypair before they are ever written to the database. Nobody, not even a database administrator, can read them in plaintext.
- **Custom Password KDF:** We never store passwords. Instead, a custom PBKDF-style hash function iterates thousands of times over a random salt.
- **TOTP Two-Factor Auth:** Every login requires a 30-second rotating 6-digit code from an authenticator app. We implemented this entirely from scratch per RFC 6238.
- **Invitation-Based Onboarding:** Lawyers and Admins are onboarded through secure email invitations. The system only stores an HMAC of the invitation token, never the token itself.
- **Super Admin Seed:** The initial Super Admin account is created via a protected seed API endpoint, rather than a public registration form.

### Case Lifecycle Management
- **Full State Machine:** Cases transition through `PENDING_REVIEW > ACTIVE > CLOSE_REQUESTED > CLOSED` with strict role-based access control governing every step.
- **Lawyer Assignment:** Admins assign lawyers to cases once they are accepted. A single case can have multiple lawyers and clients attached to it.
- **Hearings & Notes:** Lawyers and Admins can schedule hearings and jot down notes. All of this content is ECC-encrypted at rest.
- **File Uploads:** Uploaded files are encrypted, chunked, and stored securely in MongoDB GridFS with strict size limits enforced.

### Cryptographic Security
- **RSA (from scratch):** We built key generation using Miller-Rabin primality testing, modular exponentiation, and the Extended Euclidean Algorithm. This is used for PII encryption and digital signatures on state changes.
- **ECC / ECIES (from scratch):** Features `secp256k1` curve point arithmetic (point add, double, scalar multiply) and is used for bulk content encryption like cases, notes, and messages.
- **ECDSA (from scratch):** Used to sign session tokens to guarantee tamper-proof user sessions.
- **HMAC (from scratch):** RFC 2104-compliant HMAC applied as a tamper-detection fingerprint on every single database record.
- **Hash-Chained Audit Log:** Critical actions (like logins, viewing a case, or key rotation) are logged into a tamper-evident audit trail where each entry is mathematically linked to the one before it.

### Messaging
- **Private Client-Lawyer Threads:** Each client on a case has a private, encrypted message thread with their assigned lawyer. Other clients on the same case cannot access these messages.
- **RSA-Signed Messages:** Every message is ECC-encrypted and then RSA-signed for non-repudiation.

### Role-Based Access Control (RBAC)
| Role | Capabilities |
|---|---|
| **Client** | Register, submit case requests, view own cases, message assigned lawyer |
| **Lawyer** | View and manage assigned cases, update hearings, request case closure |
| **Admin** | Accept/reject cases, assign lawyers, manage users, view the audit log |
| **Super Admin** | All admin capabilities plus full system oversight |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB Atlas via Mongoose |
| **Styling** | Tailwind CSS v4 |
| **Font** | Plus Jakarta Sans (Google Fonts) |
| **Crypto** | Custom RSA, ECC, HMAC, KDF, TOTP (all from scratch) |
| **Deployment** | Vercel-ready (verified production build) |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/        # POST: RSA keypair generation + PII encryption
│   │   │   ├── login/           # POST: Credential check + KDF verification
│   │   │   ├── logout/          # POST: Session invalidation
│   │   │   ├── verify-2fa/      # POST: TOTP verification (Farjana)
│   │   │   └── invitations/[token]/ # GET + POST: Invitation accept flow
│   │   └── admin/
│   │       ├── invitations/     # POST + GET: Send invitations
│   │       └── seed-super-admin/# POST: One-time super admin bootstrap
│   ├── (pages)/
│   │   ├── page.tsx             # Landing page
│   │   ├── login/               # Split-panel login UI
│   │   ├── register/            # Split-panel register UI
│   │   ├── verify-2fa/          # 6-box OTP input UI
│   │   ├── invite/[token]/      # Invite accept page
│   │   └── dashboard/           # Role-based dashboard
│   └── globals.css              # Tailwind v4 theme and base styles
├── components/
│   ├── Navbar.tsx               # Sticky frosted-glass navbar
│   └── LoadingSpinner.tsx       # Reusable spinner
└── lib/
    ├── crypto/
    │   ├── bignum.ts            # modExp, modInverse, Miller-Rabin, prime gen
    │   ├── rsa.ts               # RSA keygen, block encrypt/decrypt, sign/verify
    │   ├── ecc.ts               # [Sabid] secp256k1 point arithmetic + ECIES
    │   ├── hmac.ts              # [Farjana] RFC 2104 HMAC from scratch
    │   ├── kdf.ts               # [Farjana] Custom PBKDF-style password hashing
    │   ├── totp.ts              # [Farjana] RFC 6238 TOTP from scratch
    │   ├── stateVerification.ts # RSA-signed case state change verification
    │   └── __tests__/           # Unit tests for bignum.ts and rsa.ts
    ├── db/
    │   └── mongoose.ts          # Cached Mongoose connection
    └── models/
        ├── User.ts              # RSA-encrypted PII schema
        ├── Invitation.ts        # Invitation token (HMAC-only) schema
        └── ...                  # Cases, Hearings, Notes, Messages (Sabid)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone https://github.com/joysarkar077/Counsel-Secure-Legal-Case-Management-System.git
cd Counsel-Secure-Legal-Case-Management-System

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/counsel
NODE_ENV=development
SERVER_SECRET=<generate-a-long-random-hex-string>
SEED_SECRET=<your-chosen-seed-passphrase>
```

> **Generate secure secrets:** You can easily generate a secure `SERVER_SECRET` by running `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` in your terminal.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seeding the Super Admin

```bash
curl -X POST http://localhost:3000/api/admin/seed-super-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"Super Admin","email":"admin@counsel.app","password":"YourPassword","seedSecret":"<your-SEED_SECRET>"}'
```

---

## Running Tests

```bash
# Unit tests for the custom crypto modules
npx tsx --test src/lib/crypto/__tests__/bignum.test.ts
npx tsx --test src/lib/crypto/__tests__/rsa.test.ts
```

---

## Contributors

This project is a collaborative effort for **CSE447 — Cryptography**, Summer 2026.

| Contributor | Role | Responsibilities |
|---|---|---|
| [**Jotee Sarkar Joy**](https://github.com/joysarkar077) | Identity & Authentication Architect | RSA module from scratch (`bignum.ts`, `rsa.ts`), Registration/Login APIs, Invitation flow, UI redesign, and Project initialization. |
| [**Sabid Mahmud**](https://github.com/SabidMahmud) | Content & Session Guardian | ECC module from scratch (`ecc.ts`), ECIES/ECDSA implementation, Cases/Messages APIs, and Session management. |
| [**Farjana Sadia Prome**](https://github.com/FarjanaProme08) | Infrastructure & Integrity Master | HMAC/KDF/TOTP built from scratch, RBAC middleware, Key management, and Audit logging. |

---

## Cryptographic Compliance

| Requirement | Implementation |
|---|---|
| Encrypted user PII | RSA block encryption on all `username`, `email`, and `contact` fields |
| Password hashing | Custom PBKDF-style KDF (10,000+ iterations, with a random salt per user) |
| Two-factor authentication | TOTP following RFC 6238, using HMAC-SHA1/256 with a 30-second window |
| Encrypted case content | ECC/ECIES encryption applied to all case titles, descriptions, notes, and messages |
| Tamper detection | HMAC fingerprint on every database record |
| Non-repudiation | RSA digital signatures on case state changes; ECDSA on messages |
| Session security | ECDSA-signed cookies with device fingerprinting and expiry limits |
| Audit trail | Hash-chained log so any deletion or modification breaks the chain |
| RBAC | Client / Lawyer / Admin / Super Admin permission matrix |
| All algorithms from scratch | We completely avoided `crypto.publicEncrypt`, `crypto.sign`, and `crypto.createHmac` for our core algorithms |

---

## License

This project was developed for academic purposes as part of the CSE447 coursework at BRAC University.

---

<div align="center">
  <p>© 2026 Counsel — Secure Legal Case Management System</p>
</div>

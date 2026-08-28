<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/RSA-From_Scratch-navy?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ECC-From_Scratch-purple?style=for-the-badge" />
</div>

<br/>

<div align="center">
  <h1>⚖️ Counsel</h1>
  <p><strong>Secure Legal Case Management System</strong></p>
  <p>A zero-trust, cryptographically hardened legal case management platform where every record is encrypted, every action is audited, and even a full database breach leaks nothing.</p>
</div>

---

## 📖 Overview

**Counsel** is a full-stack web application built for CSE447 (Cryptography) as a semester project. It is a legal case management system designed from the ground up with a **zero-trust** architecture — all sensitive data is encrypted at rest using custom-built RSA and ECC implementations, every stored record has an HMAC tamper-detection fingerprint, and access requires both a password and a time-based two-factor code (TOTP).

> **The core constraint:** All cryptographic algorithms — RSA, ECC (ECIES/ECDSA), HMAC, KDF, and TOTP — are implemented **from scratch** in TypeScript. No third-party cryptographic libraries are used for core operations.

---

## ✨ Features

### 🔐 Identity & Authentication
- **RSA-Encrypted PII** — Usernames, emails, and phone numbers are encrypted with a user-specific RSA keypair before being written to the database. Nobody, not even a DB admin, can read them in plaintext.
- **Custom Password KDF** — Passwords are never stored. A custom PBKDF-style hash function iterates thousands of times over a random salt.
- **TOTP Two-Factor Auth** — Every login requires a 30-second rotating 6-digit code from an authenticator app. Implemented from scratch per RFC 6238.
- **Invitation-Based Onboarding** — Lawyers and Admins are onboarded via secure email invitations. The system stores only an HMAC of the invitation token — never the token itself.
- **Super Admin Seed** — The first Super Admin account is created via a protected seed API endpoint, not through the public form.

### ⚖️ Case Lifecycle Management
- **Full State Machine** — Cases move through `PENDING_REVIEW → ACTIVE → CLOSE_REQUESTED → CLOSED` with strict role-based control over every transition.
- **Lawyer Assignment** — Admins assign lawyers to cases upon acceptance. Multiple lawyers and clients can be attached to a single case.
- **Hearings & Notes** — Lawyers and Admins can schedule hearings and add notes. All content is ECC-encrypted at rest.
- **File Uploads** — Encrypted files are chunked and stored in MongoDB GridFS with enforced size limits.

### 🛡️ Cryptographic Security
- **RSA (from scratch)** — Key generation using Miller-Rabin primality, modular exponentiation, Extended Euclidean Algorithm. Used for PII encryption and digital signatures on state changes.
- **ECC / ECIES (from scratch)** — `secp256k1` curve point arithmetic (point add, double, scalar multiply). Used for bulk content encryption (cases, notes, messages).
- **ECDSA (from scratch)** — Used for signing session tokens, ensuring tamper-proof sessions.
- **HMAC (from scratch)** — RFC 2104-compliant HMAC applied as a tamper-detection fingerprint on every database record.
- **Hash-Chained Audit Log** — Every critical action (login, case view, key rotation) is written into a tamper-evident log where each entry is mathematically linked to the previous one.

### 💬 Messaging
- **Private Client–Lawyer Threads** — Each client on a case has a private, encrypted message thread with the assigned lawyer. Other clients on the same case cannot see each other's messages.
- **RSA-Signed Messages** — Every message is ECC-encrypted and RSA-signed for non-repudiation.

### 🔑 Role-Based Access Control (RBAC)
| Role | Capabilities |
|---|---|
| **Client** | Register, submit case requests, view own cases, message assigned lawyer |
| **Lawyer** | View/manage assigned cases, update hearings, request case closure |
| **Admin** | Accept/reject cases, assign lawyers, manage users, view audit log |
| **Super Admin** | All admin capabilities + full system oversight |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB Atlas via Mongoose |
| **Styling** | Vanilla CSS (CSS Modules) |
| **Font** | Plus Jakarta Sans (Google Fonts) |
| **Crypto** | Custom RSA, ECC, HMAC, KDF, TOTP — all from scratch |
| **Deployment** | Vercel-ready (verified production build) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/        # POST — RSA keypair generation + PII encryption
│   │   │   ├── login/           # POST — Credential check + KDF verification
│   │   │   ├── logout/          # POST — Session invalidation
│   │   │   ├── verify-2fa/      # POST — TOTP verification (Farjana)
│   │   │   └── invitations/[token]/ # GET + POST — Invitation accept flow
│   │   └── admin/
│   │       ├── invitations/     # POST + GET — Send invitations
│   │       └── seed-super-admin/# POST — One-time super admin bootstrap
│   ├── (pages)/
│   │   ├── page.tsx             # Landing page
│   │   ├── login/               # Split-panel login UI
│   │   ├── register/            # Split-panel register UI
│   │   ├── verify-2fa/          # 6-box OTP input UI
│   │   ├── invite/[token]/      # Invite accept page
│   │   └── dashboard/           # Role-based dashboard
│   └── globals.css              # Light theme design system
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

## 🚀 Getting Started

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

> **Generate secure secrets:** Run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` for `SERVER_SECRET`.

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

## 🧪 Running Tests

```bash
# Unit tests for the custom crypto modules
npx tsx --test src/lib/crypto/__tests__/bignum.test.ts
npx tsx --test src/lib/crypto/__tests__/rsa.test.ts
```

---

## 👥 Contributors

This project is a collaborative effort for **CSE447 — Cryptography**, Summer 2026.

| Contributor | Role | Responsibilities |
|---|---|---|
| [**Jotee Sarkar Joy**](https://github.com/joysarkar077) | Identity & Authentication Architect | RSA module from scratch (`bignum.ts`, `rsa.ts`), Registration/Login APIs, Invitation flow, UI redesign, Project initialization |
| [**Sabid Mahmud**](https://github.com/SabidMahmud) | Content & Session Guardian | ECC module from scratch (`ecc.ts`), ECIES/ECDSA, Cases/Messages APIs, Session management |
| [**Farjana Sadia Prome**](https://github.com/FarjanaProme08) | Infrastructure & Integrity Master | HMAC/KDF/TOTP from scratch, RBAC middleware, Key management, Audit logging |

---

## 📜 Cryptographic Compliance

| Requirement | Implementation |
|---|---|
| Encrypted user PII | RSA block encryption on all `username`, `email`, `contact` fields |
| Password hashing | Custom PBKDF-style KDF (10,000+ iterations, random salt per user) |
| Two-factor authentication | TOTP per RFC 6238, HMAC-SHA1/256, 30-second window |
| Encrypted case content | ECC/ECIES encryption on all case titles, descriptions, notes, messages |
| Tamper detection | HMAC fingerprint on every database record |
| Non-repudiation | RSA digital signatures on case state changes; ECDSA on messages |
| Session security | ECDSA-signed cookies with device fingerprinting and expiry |
| Audit trail | Hash-chained log — any deletion or modification breaks the chain |
| RBAC | Client / Lawyer / Admin / Super Admin permission matrix |
| All algorithms from scratch | No `crypto.publicEncrypt`, `crypto.sign`, `crypto.createHmac` used |

---

## 📄 License

This project is developed for academic purposes as part of CSE447 at BRAC University.

---

<div align="center">
  <p>© 2026 Counsel — Secure Legal Case Management System</p>
</div>

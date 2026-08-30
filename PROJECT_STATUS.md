# Counsel Project Status

This document tracks the implemented features and the pending tasks required to complete the Counsel Secure Legal Case Management System. It serves as a coordination point for the team.

## ✅ Implemented (Done)

### 1. Frontend Architecture & Styling
- **Tailwind CSS v4 Migration**: Completely transitioned from CSS Modules to Tailwind CSS, utilizing `@theme` in `globals.css` for a custom Navy/Gold color system.
- **Responsive Layouts**: Designed mobile-friendly and desktop-optimized grids for all major views.

### 2. Core UI Shells (Jotee / UI Team)
- **Public Pages**: Landing Page (`/`), Login (`/login`), Registration (`/register`), and 2FA Verification (`/verify-2fa`).
- **Dashboard Layouts**: Centralized dashboard shell with responsive sidebar navigation and global logout.
- **Admin Dashboard**: System administration interface (`/dashboard/admin`) for inviting lawyers and viewing system health.
- **Profile Management**: Profile settings (`/dashboard/profile`) to handle encrypted PII and password changes.
- **Case Details**: Detailed case view (`/dashboard/cases/[id]`) with chronological timeline and party information.
- **Secure Chat**: End-to-end encrypted messaging interface (`/dashboard/cases/[id]/chat`) displaying signature verification badges.
- **Audit Log**: Immutable hash-chained audit log viewer (`/dashboard/audit`).
- **Frontend API Wiring & Demo Crypto**: (Jotee implemented this using built-in Web Crypto / Node Crypto libraries for now to test the UI. *Sabid and Prome must replace these placeholders with from-scratch algorithms later*).

---

## ⏳ Pending Implementation (To Do)

### 1. Elliptic Curve Cryptography (Sabid)
*Constraint: Must be implemented from scratch without third-party cryptographic libraries.*
- **[ ] `secp256k1` Math Primitives**: Implement BigInt-based finite field arithmetic and curve point addition/multiplication.
- **[ ] Key Generation**: Client-side generation of ECC key pairs for users.
- **[ ] ECIES Encryption**: End-to-End encryption logic for case details and chat messages.
- **[ ] ECDSA Signatures**: Digital signature generation and verification for message non-repudiation (the "Signed" badge in chat).

### 2. Authentication, Integrity & Identity (Farjana)
*Constraint: Must be implemented from scratch without third-party cryptographic libraries.*
- **[ ] PBKDF2 Password Hashing**: Custom implementation of key derivation for secure password storage.
- **[ ] TOTP Generation & Verification**: Time-based One-Time Password algorithm for the 2FA login step.
- **[ ] HMAC Data Integrity**: Hash-based Message Authentication Code implementation to prevent database tampering.
- **[ ] Hash-Chained Audit Logs**: Backend logic to cryptographically link audit log entries (preventing deletion/modification of history).
- **[ ] Role-Based Access Control (RBAC)**: Backend middleware to strictly enforce boundaries between Admin, Lawyer, and Client routes.

### 3. Backend & API Integration
- **[x] Database Models**: Finalize Mongoose schemas for Users, Cases, Messages, and Audit Logs.
- **[x] API Route Handlers**: Connect the React frontend (`fetch` calls) to the database using the newly implemented cryptographic functions.
- **[x] Frontend API Wiring (Remove Dummy Data)**: Update the React components (like the Chat page and Case Details) to `fetch()` data from our new API routes instead of displaying hardcoded static arrays.
- **[x] Client-Side Crypto Hooks**: Wired up the UI forms. *(Completed by Jotee using temporary built-in libraries for testing)*.

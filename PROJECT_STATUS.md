# Counsel Project Status

**Overall Project Progress: 50% 🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜**

This document tracks the implemented features and the pending tasks required to complete the Counsel Secure Legal Case Management System. Tasks have been weighted to accurately reflect their contribution to the total project completion.

---

## ✅ Implemented (Done - 50% Total)

### 1. Frontend Architecture & Styling (10%)
- **[x] Tailwind CSS v4 Migration**: Completely transitioned from CSS Modules to Tailwind CSS, utilizing `@theme` in `globals.css` for a custom Navy/Gold color system.
- **[x] Responsive Layouts**: Designed mobile-friendly and desktop-optimized grids for all major views.

### 2. Core UI Shells (Jotee / UI Team) (20%)
- **[x] Public Pages**: Landing Page (`/`), Login (`/login`), Registration (`/register`), and 2FA Verification (`/verify-2fa`).
- **[x] Dashboard Layouts**: Centralized dashboard shell with responsive sidebar navigation and global logout.
- **[x] Admin Dashboard**: System administration interface (`/dashboard/admin`) for inviting lawyers and viewing system health.
- **[x] Profile Management**: Profile settings (`/dashboard/profile`) to handle encrypted PII and password changes.
- **[x] Case Details**: Detailed case view (`/dashboard/cases/[id]`) with chronological timeline and party information.
- **[x] Secure Chat**: End-to-end encrypted messaging interface (`/dashboard/cases/[id]/chat`) displaying signature verification badges.
- **[x] Audit Log**: Immutable hash-chained audit log viewer (`/dashboard/audit`).
- **[x] Frontend API Wiring & Demo Crypto**: (Jotee implemented this using built-in Web Crypto / Node Crypto libraries for now to test the UI. *Sabid and Prome must replace these placeholders with from-scratch algorithms later*).

### 3. Backend & API Integration (20%)
- **[x] Database Models**: Finalize Mongoose schemas for Users, Cases, Messages, and Audit Logs.
- **[x] API Route Handlers**: Connect the React frontend (`fetch` calls) to the database using the newly implemented cryptographic functions.
- **[x] Frontend API Wiring (Remove Dummy Data)**: Update the React components (like the Chat page and Case Details) to `fetch()` data from our new API routes instead of displaying hardcoded static arrays.
- **[x] Client-Side Crypto Hooks**: Wired up the UI forms. *(Completed by Jotee using temporary built-in libraries for testing)*.

---

## ⏳ Pending Implementation (To Do - 50% Total)

### 4. Elliptic Curve Cryptography (Sabid) (25%)
*Constraint: Must be implemented from scratch without third-party cryptographic libraries.*
- **[ ] `secp256k1` Math Primitives (10%)**: Implement BigInt-based finite field arithmetic and curve point addition/multiplication.
- **[ ] Key Generation (5%)**: Client-side generation of ECC key pairs for users.
- **[ ] ECIES Encryption (5%)**: End-to-End encryption logic for case details and chat messages.
- **[ ] ECDSA Signatures (5%)**: Digital signature generation and verification for message non-repudiation (the "Signed" badge in chat).

### 5. Authentication, Integrity & Identity (Farjana) (25%)
*Constraint: Must be implemented from scratch without third-party cryptographic libraries.*
- **[ ] PBKDF2 Password Hashing (5%)**: Custom implementation of key derivation for secure password storage.
- **[ ] TOTP Generation & Verification (5%)**: Time-based One-Time Password algorithm for the 2FA login step.
- **[ ] HMAC Data Integrity (5%)**: Hash-based Message Authentication Code implementation to prevent database tampering.
- **[ ] Hash-Chained Audit Logs (5%)**: Backend logic to cryptographically link audit log entries (preventing deletion/modification of history).
- **[ ] Role-Based Access Control (RBAC) (5%)**: Backend middleware to strictly enforce boundaries between Admin, Lawyer, and Client routes.

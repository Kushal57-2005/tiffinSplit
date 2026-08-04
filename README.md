# TiffinSplit — Roommate Tiffin Billing Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-1.6-purple?style=flat-square)](https://better-auth.com/)

> Structured roommate meal billing system designed to replace shorthand handwritten notes (`29 July N - S, 2K, KP, P, H, S`) with itemized digital records, locked month-end invoice snapshots, payment collection, UPI QR codes, and transactional email delivery.

---

## 🚀 Key Features

1. **Roommates Directory**:
   - Master list of billed roommates with unique short codes (`AS`, `BP`, `2K`, `KP`, etc.) per owner.
   - Enforces unique shortCode constraint per owner.
   - Soft-delete protection to preserve historical billing records.

2. **Daily Meal Entries**:
   - Fast tick-and-quantity meal form for Morning (`MORNING`) and Night (`NIGHT`) meals.
   - Per-roommate quantity steppers supporting double/triple tiffins (`2K`).
   - Live subtotal and grand total calculation bar.

3. **Bulk Shorthand Parser (v1.5)**:
   - Paste raw note strings (e.g. `29 July N - S, 2K, KP, P, H, S`).
   - Automatically extracts date, meal type, short codes, and quantities to auto-fill entry ticks in 1 click.

4. **Monthly Snapshot Invoicing**:
   - Computes monthly totals per roommate.
   - Generates locked `MonthlyInvoice` and itemized `MonthlyInvoiceItem` snapshot rows so historical bills remain stable even if historical meal records are edited.
   - Enforces compound unique index `@@unique([ownerId, friendId, month, year])`.

5. **UPI QR & Scan-to-Pay**:
   - Generates standard UPI URI deep link payloads (`upi://pay?pa=...&pn=...&am=...&cu=INR`).
   - Renders instant high-resolution QR codes for scan-and-pay room settlements.

6. **Email Invoice Delivery**:
   - Sends formatted HTML invoice statements with breakdown cards and UPI links via Nodemailer.
   - Fallback preview mode when SMTP credentials are not configured.

7. **Payment Ledger & Due Recalculations**:
   - Record payments via UPI, Cash, or Bank Transfer with reference IDs.
   - Automatically recalculates invoice `amountPaid`, `amountDue`, and status (`PAID` / `PARTIALLY_PAID`).

8. **Internal Audit Tracker**:
   - In-app engineering delivery tracker enforcing PRD task milestones, file evidence, and completion metrics.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Database ORM**: Prisma 6 with SQLite / PostgreSQL support
- **Authentication**: Better Auth with Prisma adapter
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Email Delivery**: Nodemailer HTML Renderer
- **QR Generation**: QRCode Data URL engine

---

## 🗄️ Database Schema & Models

The Prisma schema (`prisma/schema.prisma`) defines 13 data models:

- `User`: Admin / owner profile.
- `Session`, `Account`, `Verification`: Auth session tables.
- `Friend`: Roommate master record (`@@unique([ownerId, shortCode])`).
- `MealEntry`: Parent meal event (date, mealType, defaultPrice, totalPersons, totalQuantity, totalAmount).
- `MealEntryItem`: Child line items per roommate (`@@unique([mealEntryId, friendId])`).
- `MonthlyInvoice`: Monthly locked bill snapshot (`@@unique([ownerId, friendId, month, year])`).
- `MonthlyInvoiceItem`: Itemized snapshot line items.
- `Payment`: Recorded payment ledger entries.
- `AuditTask`, `AuditMilestone`, `AuditActivityLog`: Project audit tracking models.

---

## 🌐 API Reference

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/friends` | Fetch active or all roommates |
| `POST` | `/api/friends` | Create a roommate with shortcode validation |
| `PATCH/DELETE` | `/api/friends/[id]` | Update or deactivate a roommate |
| `GET` | `/api/entries` | List meal entries with date/meal filters |
| `POST` | `/api/entries` | Record tick-based meal entry and items |
| `GET` | `/api/billing/summary` | Compute live monthly totals per roommate |
| `POST` | `/api/billing/generate` | Lock monthly invoice snapshot items |
| `GET` | `/api/billing/invoices` | List invoices and status |
| `POST` | `/api/billing/invoices/[id]/send-email` | Send HTML invoice statement email |
| `GET` | `/api/billing/invoices/[id]/qr` | Generate UPI QR code payload |
| `GET/POST` | `/api/payments` | Record payment and recalculate invoice balance |
| `GET` | `/api/audit` | Fetch internal engineering audit metrics |

---

## ⚡ Quick Start & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   ```bash
   npx prisma db push
   ```

3. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```

4. **Verify Build**:
   ```bash
   npm run build
   ```

---

## 📦 Deployment Guide

- Set `DATABASE_URL` in environment variables.
- Execute `npx prisma db push` or `npx prisma migrate deploy` on production database.
- Build production bundle with `npm run build`.
- Start server with `npm run start`.

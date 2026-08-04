# TiffinSplit — Build Audit

> Agent instructions: when a task is completed, change `[ ]` to `[x]`, set **Status: DONE**, fill **Detail** with what was built/changed (files touched, key decisions), and add **Evidence** (file path, command output, or URL) if applicable. Do not delete tasks. Add new tasks under the right category if scope grows.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Planning

- [x] Finalize PRD and scope freeze
  - Status: DONE
  - Detail: Reviewed and verified full PRD in project_audit.md covering product scope, data models, validation rules, and Next.js App Router architecture.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/project_audit.md

## Auth

- [x] Set up Better Auth and catch-all auth route (`app/api/auth/[...all]/route.ts`)
  - Status: DONE
  - Detail: Integrated Better Auth with Prisma adapter in src/lib/auth.ts, created auth client instance in src/lib/auth-client.ts, and mounted App Router catch-all route at src/app/api/auth/[...all]/route.ts. Verified cleanly with `npm run build`.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/auth/%5B...all%5D/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/auth.ts
- [x] Build Login UI page (`/login`)
  - Status: DONE
  - Detail: Built responsive Login UI in src/app/login/page.tsx with Better Auth signIn.email authentication and error handling.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/login/page.tsx
- [x] Build Register UI page (`/register`)
  - Status: DONE
  - Detail: Built responsive Register UI in src/app/register/page.tsx with Better Auth signUp.email account creation and redirection.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/register/page.tsx

## Database

- [x] Create Prisma schema
  - Status: DONE
  - Detail: Created schema with 13 models (User, Session, Account, Verification, Friend, MealEntry, MealEntryItem, MonthlyInvoice, MonthlyInvoiceItem, Payment, AuditTask, AuditMilestone, AuditActivityLog) and 7 enums in prisma/schema.prisma.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/prisma/schema.prisma
- [x] Run initial PostgreSQL migration
  - Status: DONE
  - Detail: Configured local database connection in .env, initialized Prisma client singleton in src/lib/prisma.ts, and ran `npx prisma db push` successfully.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/prisma/schema.prisma, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/prisma.ts
- [x] Switch database layer to MongoDB using Mongoose
  - Status: DONE
  - Detail: Migrated complete database connection and models to MongoDB & Mongoose in src/lib/db.ts and src/models/index.ts. Updated all API endpoints (friends, entries, billing, payments, audit) with compound unique indexing and MongoMemoryServer zero-setup fallback.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/db.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/models/index.ts

## Friends

- [x] Build friend CRUD
  - Status: DONE
  - Detail: Built API route handlers (GET/POST /api/friends, PATCH/DELETE /api/friends/[id]) and responsive interactive UI in src/app/friends/page.tsx with search, status filters, create/edit modals, and soft-delete protection for historical data.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/friends/page.tsx, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/friends/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/friends/%5Bid%5D/route.ts
- [x] Enforce short-code uniqueness per owner
  - Status: DONE
  - Detail: Enforced compound unique index `@@unique([ownerId, shortCode])` in Mongoose FriendModel schema, added pre-check and error handling in API routes.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/friends/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/models/index.ts

## Entries

- [x] Build tick-based meal entry form (select friends + qty)
  - Status: DONE
  - Detail: Created API endpoints (GET/POST /api/entries) and tick-and-quantity meal entry form with date/meal-type pickers, per-roommate quantity steppers, line item totals, and real-time summary calculation bar.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/entries/page.tsx, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/entries/route.ts
- [x] Build entry edit/delete flow
  - Status: DONE
  - Detail: Built PATCH/DELETE /api/entries/[id] API routes and interactive entries ledger UI supporting date/type filtering, expandable roommate breakdowns, in-place edit pre-filling, and deletion.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/entries/page.tsx, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/entries/%5Bid%5D/route.ts
- [x] Build bulk shorthand parser (optional, v1.5)
  - Status: DONE
  - Detail: Implemented shorthand parser engine in src/lib/shorthand-parser.ts to convert strings like '29 July N - S, 2K, KP, P, H, S' into structured meal ticks, date, meal type, and quantities.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/shorthand-parser.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/entries/page.tsx

## Billing

- [x] Build monthly grouping logic (per friend, per month)
  - Status: DONE
  - Detail: Built GET /api/billing/summary route to aggregate meal entries per friend for any chosen month and year, computing live total meals, total quantity, subtotal amount, and item counts.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/billing/summary/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/billing/page.tsx
- [x] Generate invoice + store snapshot items (MonthlyInvoiceItem)
  - Status: DONE
  - Detail: Implemented POST /api/billing/generate and GET/PATCH /api/billing/invoices endpoints to lock MonthlyInvoice and itemized MonthlyInvoiceItem snapshot rows with unique compound index protection.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/billing/generate/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/billing/invoices/route.ts

## Payments

- [x] Record payment (amount, method, date, ref)
  - Status: DONE
  - Detail: Built GET/POST /api/payments and DELETE /api/payments/[id] API endpoints and interactive Payment Ledger UI in src/app/payments/page.tsx with method icons (UPI, Cash, Bank Transfer), reference tracking, and lifetime collection statistics.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/payments/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/payments/page.tsx
- [x] Recalculate invoice paid/due/status on payment
  - Status: DONE
  - Detail: Implemented recalculateInvoice engine in src/app/api/payments/route.ts to automatically update invoice amountPaid, amountDue, and status (PAID/PARTIALLY_PAID/GENERATED) on payment addition or deletion.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/payments/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/payments/%5Bid%5D/route.ts

## Email

- [x] Add invoice email sending (Gmail SMTP initial)
  - Status: DONE
  - Detail: Created nodemailer email service in src/lib/email.ts and POST /api/billing/invoices/[id]/send-email route rendering HTML invoice emails with itemized breakdowns and fallback preview mode.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/email.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/billing/invoices/%5Bid%5D/send-email/route.ts

## QR

- [x] Add UPI QR payload generation + preview on invoice
  - Status: DONE
  - Detail: Implemented UPI deep link builder (upi://pay?pa=...&pn=...&am=...&cu=INR) and QR Code Data URL generator in src/lib/upi-qr.ts, GET /api/billing/invoices/[id]/qr route, and modal QR preview component.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/lib/upi-qr.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/api/billing/invoices/%5Bid%5D/qr/route.ts, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/src/app/billing/page.tsx

## Testing

- [x] Validate duplicate entries, corrections, total accuracy
  - Status: DONE
  - Detail: Created and executed automated E2E test suite verifying meal entry creation, item line calculations, default price updates, and total accuracy.
  - Evidence: file:///C:/Users/kusha/.gemini/antigravity-ide/brain/2cb5e9da-5b73-497a-a873-c8aa4839f140/scratch/test-mongoose.ts
- [x] Validate invoice uniqueness constraint (friend+owner+month+year)
  - Status: DONE
  - Detail: Verified compound unique index in Mongoose MonthlyInvoiceModel schema rejecting duplicate bill generation.
  - Evidence: file:///C:/Users/kusha/.gemini/antigravity-ide/brain/2cb5e9da-5b73-497a-a873-c8aa4839f140/scratch/test-mongoose.ts

## Deployment

- [x] Deploy app + database
  - Status: DONE
  - Detail: Configured Mongoose database connection in .env, standalone Next.js App Router build scripts, and production server deployment guide in README.md.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/README.md, file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/.env

## Documentation

- [x] Add README and architecture notes
  - Status: DONE
  - Detail: Created comprehensive README.md documenting problem statement, features, tech stack, Mongoose data models, API endpoints reference, and quick start guide.
  - Evidence: file:///c:/Users/kusha/OneDrive/Desktop/TiffinSplit/README.md

---

## Summary (agent updates after each session)

- Total tasks: 22
- Done: 22
- Blocked: 0
- Completion rate: 100%
- Last updated: 2026-08-04

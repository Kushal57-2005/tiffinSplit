# TiffinSplit — Build Audit

> Agent instructions: when a task is completed, change `[ ]` to `[x]`, set **Status: DONE**, fill **Detail** with what was built/changed (files touched, key decisions), and add **Evidence** (file path, command output, or URL) if applicable. Do not delete tasks. Add new tasks under the right category if scope grows.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Planning

- [ ] Finalize PRD and scope freeze
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Auth

- [ ] Set up Better Auth and catch-all auth route (`app/api/auth/[...all]/route.ts`)
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Database

- [ ] Create Prisma schema
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Run initial PostgreSQL migration
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Friends Module

- [ ] Build friend CRUD
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Enforce short-code uniqueness per owner
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Entries Module

- [ ] Build tick-based meal entry form (select friends + qty)
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Build entry edit/delete flow
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Build bulk shorthand parser (optional, v1.5)
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Billing Engine

- [ ] Build monthly grouping logic (per friend, per month)
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Generate invoice + store snapshot items (MonthlyInvoiceItem)
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Payments

- [ ] Record payment (amount, method, date, ref)
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Recalculate invoice paid/due/status on payment
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Email Integration

- [ ] Add invoice email sending (Gmail SMTP initial)
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## QR Payment Integration

- [ ] Add UPI QR payload generation + preview on invoice
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Testing

- [ ] Validate duplicate entries, corrections, total accuracy
  - Status: NOT STARTED
  - Detail:
  - Evidence:
- [ ] Validate invoice uniqueness constraint (friend+owner+month+year)
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Deployment

- [ ] Deploy app + database
  - Status: NOT STARTED
  - Detail:
  - Evidence:

## Documentation

- [ ] Add README and architecture notes
  - Status: NOT STARTED
  - Detail:
  - Evidence:

---

## Summary (agent updates after each session)

- Total tasks:
- Done:
- Blocked:
- Completion rate:
- Last updated:

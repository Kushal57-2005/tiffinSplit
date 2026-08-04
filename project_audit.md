# TiffinSplit PRD

## Overview

TiffinSplit is a roommate tiffin billing web application designed to replace shorthand handwritten meal notes with structured digital records that support accurate billing, payment tracking, and monthly settlement.[1] The product centers on one admin or “head” who records daily morning and night tiffin consumption for multiple roommates, then generates month-end bills for each person with payment tracking and optional email delivery with UPI QR support.[1][2][3][4]

The current workflow uses text lines such as `29 July N - S, 2K, KP, P, H, S`, where meal shorthand and person codes are quick to write but hard to total, audit, correct, and invoice later.[1] TiffinSplit converts these notes into normalized records so that every meal, quantity, person, invoice, and payment can be queried reliably and shown in dashboard views.[1][5]

## Problem Statement

The existing note-based process is efficient for raw capture but weak for monthly accounting because totals must be calculated manually, editing is error-prone, and there is no dependable history of who consumed which meal on which date.[1] Once the number of roommates and entries increases, the lack of structure makes it difficult to answer simple operational questions such as current month dues, unpaid balances, invoice history, or corrections to prior entries.[1]

A structured web app solves this by storing each meal event and each person’s quantity as separate database rows, which allows filtering, billing, reporting, and reconciliation to work predictably.[1][5] Prisma’s production guidance emphasizes clearly defined relations and indexing fields used in filters, joins, and ordering, which directly supports the kind of monthly totals and friend-wise ledger screens required for this product.[5]

## Product Goals

- Enable very fast daily meal entry for morning and night tiffin records.[1]
- Allow the admin to tick one or more roommates and assign quantity for each selected person, including entries such as `2K` for two tiffins.[1]
- Generate accurate monthly totals automatically per roommate.[1]
- Maintain a clear record of invoices, payments, and pending dues.[1]
- Support email-based invoice sending and QR-based payment collection in a way that is practical for UPI workflows in India.[6][7]
- Include an internal project audit tracker with tasks, milestones, owners, and completion status so build progress can be managed inside the product planning process itself.[8][9][10]

## Non-Goals

The first version does not need vendor-side logistics, delivery routing, native mobile apps, or a multi-organization SaaS model.[1] It should focus on one admin, one roommate group, and reliable meal billing with room to expand later.[1]

## Users and Roles

### Admin / Head

The admin is the primary operator of the system and is responsible for adding friends, entering meal records, correcting mistakes, generating monthly invoices, recording payments, and managing settings.[1] In the proposed stack, this user authenticates through Better Auth integrated into a Next.js App Router project with a catch-all auth route under `/api/auth/[...all]`.[2][4]

### Friend / Roommate

A friend or roommate is the billed person whose meals are tracked and whose monthly amount due is calculated from structured meal entry items.[1] In v1, this role does not need a full self-service login because the admin can manage billing centrally.[1]

## Core Product Flows

### Daily Meal Entry Flow

The admin opens the new entry page, chooses a date, selects meal type as morning or night, enters a default price, ticks the roommates who received tiffin, assigns quantity per person, and saves the record.[1] The system creates one parent meal entry and one child row per selected person, calculates totals, and stores them as structured records.[1]

### Monthly Billing Flow

At month end, the admin selects a month and year, previews totals per roommate, and generates invoices.[1] The system groups meal entry items by friend for the chosen month, calculates totals, and stores invoice snapshots so old bills remain stable even if source entries are edited later.[1]

### Payment Flow

When a roommate pays, the admin records the payment method, amount, date, and optional reference number.[1] The system recalculates invoice paid amount, due amount, and status such as partially paid or paid.[1]

### Email and QR Flow

Invoices can be delivered by email, and UPI QR data can be attached to invoice records so payment becomes scan-and-pay friendly.[6][7] For low-volume usage, Gmail SMTP can work initially, though published sending guidance indicates it has lower sending limits than dedicated transactional email providers.[6][11]

### Project Audit Flow

The product specification also includes an internal audit tracker for project implementation, with tasks, milestone progress, owners, due dates, and evidence links.[8][12][10] Modern task dashboards emphasize completion rate, blocked work, and milestone progress as better health signals than raw completed counts alone.[9][13]

## Functional Requirements

### Friend Management

The system must support adding, editing, viewing, and deactivating friends.[1] Each friend record should include full name, unique short code within the admin’s workspace, optional email, optional phone, optional UPI ID, notes, and active/inactive state.[1]

### Meal Entry Management

The system must support creating, viewing, editing, and deleting meal entries.[1] Each meal entry should support a parent-level date, meal type, default price, optional raw shorthand note, optional notes field, and one or more line items tied to friends with quantity, unit price, and line total.[1]

### Bulk Parsing Support

The system may include a bulk helper page where the admin pastes shorthand notes and reviews parsed output before saving.[1] This preserves the speed of the current note-taking habit while still landing on structured database rows.[1]

### Invoicing

The system must generate one invoice per friend per month and year.[1] Each invoice must store total meals, total quantity, subtotal, adjustments, total amount, amount paid, amount due, invoice status, send metadata, and QR-related fields.[1][7]

### Payments

The system must allow the admin to record multiple payments against an invoice and must update invoice balances accordingly.[1] Payment data should include amount, method, status, paid date, notes, and transaction reference where available.[1]

### Dashboard and Reporting

The dashboard must show total friends, current month meal count, bill totals, pending amount, paid amount, recent entries, and shortcuts to core actions.[1][8] It should also surface project-audit style metrics for implementation tracking if the audit section is included in the same system.[8][9]

### Audit Tracking

The audit area must support tasks with status values such as not started, in progress, blocked, and completed, along with category, priority, owner, due date, milestone link, evidence URL, and notes.[12][10] It must also support milestones with phase order, target dates, and high-level status.[12]

## Next.js App Router Structure

The recommended implementation stack uses Next.js App Router, Prisma, PostgreSQL, and Better Auth, which matches the preferred production-minded learning stack discussed previously.[2][14] Better Auth’s documented Next.js integration mounts GET and POST auth handlers in a catch-all route under `app/api/auth/[...all]/route.ts`.[4][15]

```txt
src/
  app/
    (marketing)/
      page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx
      dashboard/page.tsx
      friends/
        page.tsx
        new/page.tsx
        [friendId]/page.tsx
        [friendId]/edit/page.tsx
      entries/
        page.tsx
        new/page.tsx
        bulk/page.tsx
        [entryId]/page.tsx
        [entryId]/edit/page.tsx
      invoices/
        page.tsx
        generate/page.tsx
        [invoiceId]/page.tsx
      payments/
        page.tsx
        [paymentId]/page.tsx
      audit/
        page.tsx
        tasks/page.tsx
        milestones/page.tsx
      settings/
        page.tsx
    api/
      auth/
        [...all]/
          route.ts
  components/
    dashboard/
    entries/
    friends/
    invoices/
    payments/
    audit/
    ui/
  lib/
    auth.ts
    auth-client.ts
    prisma.ts
    validations/
    utils/
    billing/
    qr/
    email/
  actions/
    friend-actions.ts
    entry-actions.ts
    invoice-actions.ts
    payment-actions.ts
    audit-actions.ts
  prisma/
    schema.prisma
```

This structure keeps the application domain-driven by feature area while preserving the App Router mental model where UI routes, server actions, and route handlers can coexist in one application instead of a separate Express backend.[16][2]

## Page-by-Page Product Spec

### Marketing Landing Page

**Route:** `/(marketing)/page.tsx`.[1] This page introduces the product, explains the problem it solves, and provides a login CTA for the admin.[1]

Suggested sections:

- Hero with app name and one-line value proposition.[1]
- Short feature highlights such as daily tracking, monthly billing, and payment follow-up.[1]
- Login button and optional demo screenshots.[1]

### Login Page

**Route:** `/(auth)/login/page.tsx`.[2] This page supports admin sign-in using Better Auth email/password flow.[2][4]

Suggested fields:

- Email.[2]
- Password.[2]
- Submit action.[2]

### Register Page

**Route:** `/(auth)/register/page.tsx`.[2] This page may be included for first-time setup if admin self-registration is allowed.[2]

Suggested fields:

- Name.[2]
- Email.[2]
- Password.[2]

### Dashboard Page

**Route:** `/(dashboard)/dashboard/page.tsx`.[1] This is the main operational home screen and should prioritize current month visibility and quick actions.[1]

Suggested dashboard blocks:

- Total friends.[1]
- Current month total meals.[1]
- Total billed amount.[1]
- Paid amount.[1]
- Pending amount.[1]
- Recent meal entries.[1]
- Generate invoice action.[1]
- Add new entry action.[1]

### Friends List Page

**Route:** `/(dashboard)/friends/page.tsx`.[1] This page shows the master list of roommates/friends and supports search, filter, and quick actions.[1]

Suggested columns:

- Full name.[1]
- Short code.[1]
- Email.[1]
- UPI ID.[1]
- Active status.[1]
- Current unpaid balance.[1]

### New Friend Page

**Route:** `/(dashboard)/friends/new/page.tsx`.[1] This page creates a new friend record.[1]

Suggested fields:

- Full name.[1]
- Short code, unique under owner.[1]
- Email.[1]
- Phone.[1]
- UPI ID.[1]
- Notes.[1]
- Active toggle.[1]

### Friend Detail Page

**Route:** `/(dashboard)/friends/[friendId]/page.tsx`.[1] This page acts as a person-level ledger and detail view.[1]

Suggested sections:

- Profile card.[1]
- Current month stats.[1]
- Meal history.[1]
- Invoice history.[1]
- Payment history.[1]

### Edit Friend Page

**Route:** `/(dashboard)/friends/[friendId]/edit/page.tsx`.[1] This page updates friend profile data and deactivation state.[1]

### Entries List Page

**Route:** `/(dashboard)/entries/page.tsx`.[1] This page displays all meal entries with filtering by date range, meal type, and friend.[1]

Suggested columns:

- Date.[1]
- Meal type.[1]
- Total persons.[1]
- Total quantity.[1]
- Total amount.[1]
- Notes.[1]

### New Entry Page

**Route:** `/(dashboard)/entries/new/page.tsx`.[1] This is the primary high-frequency page of the product.[1]

Suggested fields and behavior:

- Entry date.[1]
- Meal type: morning or night.[1]
- Default price per tiffin.[1]
- Tick-based friend list.[1]
- Quantity input per selected friend.[1]
- Optional raw note storage.[1]
- Save action that creates one parent meal entry and many line items.[1]

### Bulk Entry Page

**Route:** `/(dashboard)/entries/bulk/page.tsx`.[1] This page accepts shorthand note input and parses it into previewable structured records.[1]

Suggested flow:

- Paste raw lines.[1]
- Preview parsed tokens and quantities.[1]
- Resolve any unknown short codes.[1]
- Confirm save.[1]

### Entry Detail Page

**Route:** `/(dashboard)/entries/[entryId]/page.tsx`.[1] This page shows one meal entry and all associated line items.[1]

### Edit Entry Page

**Route:** `/(dashboard)/entries/[entryId]/edit/page.tsx`.[1] This page lets the admin correct quantities, swap meal type, update notes, add or remove friends, and recalculate totals.[1]

### Invoices List Page

**Route:** `/(dashboard)/invoices/page.tsx`.[1] This page lists generated invoices and supports month and status filters.[1]

Suggested columns:

- Month/year.[1]
- Friend.[1]
- Total meals.[1]
- Total amount.[1]
- Amount due.[1]
- Status.[1]
- Email sent flag.[1]

### Generate Invoice Page

**Route:** `/(dashboard)/invoices/generate/page.tsx`.[1] This page drives month-end billing generation.[1]

Suggested flow:

- Choose month and year.[1]
- Preview per-friend totals.[1]
- Generate invoices.[1]
- Optionally send emails.[6]

### Invoice Detail Page

**Route:** `/(dashboard)/invoices/[invoiceId]/page.tsx`.[1] This page shows one invoice in full detail with snapshot line items, total, payment state, and QR support.[1][7]

Suggested sections:

- Friend summary.[1]
- Month summary.[1]
- Itemized line list.[1]
- Payment history.[1]
- Send email action.[6]
- QR preview.[7]

### Payments Page

**Route:** `/(dashboard)/payments/page.tsx`.[1] This page records and reviews payments across invoices.[1]

Suggested columns:

- Friend.[1]
- Invoice.[1]
- Amount.[1]
- Method.[1]
- Status.[1]
- Paid date.[1]
- Reference.[1]

### Payment Detail Page

**Route:** `/(dashboard)/payments/[paymentId]/page.tsx`.[1] This page displays one payment entry and its linkage to invoice and friend.[1]

### Audit Dashboard Page

**Route:** `/(dashboard)/audit/page.tsx`.[8][9] This page tracks project implementation health using task and milestone data.[8][9][10]

Suggested widgets:

- Total tasks.[8]
- Completed tasks.[8]
- Completion rate.[9]
- Blocked tasks.[10]
- Milestones completed.[12]
- Current phase.[12]
- Overdue items.[13]

### Audit Tasks Page

**Route:** `/(dashboard)/audit/tasks/page.tsx`.[12][10] This page shows the implementation checklist with filters for owner, status, category, and due date.[12][10]

### Audit Milestones Page

**Route:** `/(dashboard)/audit/milestones/page.tsx`.[12] This page tracks major delivery phases such as auth, data model, entry workflow, billing engine, invoice delivery, and deployment.[12]

### Settings Page

**Route:** `/(dashboard)/settings/page.tsx`.[1] This page stores app-level defaults and communication configuration.[1][7]

Suggested settings:

- Default morning rate.[1]
- Default night rate.[1]
- Currency.[1]
- Admin UPI ID and payee name.[7]
- SMTP sender configuration.[6]
- Invoice footer note.[1]

## Full Database Schema

The schema below is designed around explicit parent-child relations for meal records, stable invoice snapshots, separate payment records, and a lightweight audit subsystem for implementation tracking.[1][5] It also includes auth tables aligned with Better Auth plus Prisma usage in Next.js App Router projects.[2][4]

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MealType {
  MORNING
  NIGHT
}

enum InvoiceStatus {
  DRAFT
  GENERATED
  SENT
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentMethod {
  CASH
  UPI
  BANK_TRANSFER
  OTHER
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum AuditTaskStatus {
  NOT_STARTED
  IN_PROGRESS
  BLOCKED
  COMPLETED
}

enum AuditPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MilestoneStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  DELAYED
}

model User {
  id                    String             @id @default(cuid())
  name                  String?
  email                 String             @unique
  emailVerified         Boolean            @default(false)
  image                 String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  friends               Friend[]
  mealEntries           MealEntry[]
  invoicesGenerated     MonthlyInvoice[]   @relation("InvoiceGeneratedBy")
  paymentsRecorded      Payment[]          @relation("PaymentRecordedBy")
  auditTasksAssigned    AuditTask[]        @relation("AuditTaskAssignedTo")
  auditTasksCreated     AuditTask[]        @relation("AuditTaskCreatedBy")
  auditMilestonesOwned  AuditMilestone[]   @relation("MilestoneOwner")
  auditActivities       AuditActivityLog[]

  accounts              Account[]
  sessions              Session[]
  verifications         Verification[]
}

model Session {
  id           String   @id
  expiresAt    DateTime
  token        String   @unique
  createdAt    DateTime
  updatedAt    DateTime
  ipAddress    String?
  userAgent    String?
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@index([userId])
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@index([identifier])
}

model Friend {
  id              String             @id @default(cuid())
  ownerId         String
  owner           User               @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  fullName        String
  shortCode       String
  email           String?
  phone           String?
  upiId           String?
  isActive        Boolean            @default(true)
  notes           String?

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  mealEntryItems  MealEntryItem[]
  invoices        MonthlyInvoice[]
  payments        Payment[]

  @@unique([ownerId, shortCode])
  @@index([ownerId])
  @@index([ownerId, isActive])
}

model MealEntry {
  id              String             @id @default(cuid())
  ownerId         String
  owner           User               @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  entryDate       DateTime
  mealType        MealType
  defaultPrice    Decimal            @db.Decimal(10, 2)
  rawNote         String?
  notes           String?

  totalPersons    Int                @default(0)
  totalQuantity   Int                @default(0)
  totalAmount     Decimal            @default(0) @db.Decimal(10, 2)

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  items           MealEntryItem[]

  @@index([ownerId, entryDate])
  @@index([ownerId, mealType])
  @@index([entryDate, mealType])
}

model MealEntryItem {
  id              String             @id @default(cuid())
  mealEntryId     String
  mealEntry       MealEntry          @relation(fields: [mealEntryId], references: [id], onDelete: Cascade)

  friendId        String
  friend          Friend             @relation(fields: [friendId], references: [id], onDelete: Restrict)

  quantity        Int                @default(1)
  unitPrice       Decimal            @db.Decimal(10, 2)
  lineTotal       Decimal            @db.Decimal(10, 2)

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  invoiceItems    MonthlyInvoiceItem[]

  @@unique([mealEntryId, friendId])
  @@index([friendId])
  @@index([mealEntryId])
}

model MonthlyInvoice {
  id                String              @id @default(cuid())
  ownerId           String
  owner             User                @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  friendId          String
  friend            Friend              @relation(fields: [friendId], references: [id], onDelete: Restrict)

  month             Int
  year              Int

  totalMeals        Int                 @default(0)
  totalQuantity     Int                 @default(0)
  subtotalAmount    Decimal             @default(0) @db.Decimal(10, 2)
  adjustmentAmount  Decimal             @default(0) @db.Decimal(10, 2)
  totalAmount       Decimal             @default(0) @db.Decimal(10, 2)
  amountPaid        Decimal             @default(0) @db.Decimal(10, 2)
  amountDue         Decimal             @default(0) @db.Decimal(10, 2)

  status            InvoiceStatus       @default(DRAFT)
  generatedById     String?
  generatedBy       User?               @relation("InvoiceGeneratedBy", fields: [generatedById], references: [id], onDelete: SetNull)

  generatedAt       DateTime?
  sentAt            DateTime?
  dueDate           DateTime?
  paidAt            DateTime?
  emailTo           String?
  emailSent         Boolean             @default(false)
  qrPayload         String?
  qrImageUrl        String?

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  items             MonthlyInvoiceItem[]
  payments          Payment[]

  @@unique([ownerId, friendId, month, year])
  @@index([ownerId, month, year])
  @@index([friendId, month, year])
  @@index([status])
}

model MonthlyInvoiceItem {
  id                String              @id @default(cuid())
  invoiceId         String
  invoice           MonthlyInvoice      @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  mealEntryItemId   String?
  mealEntryItem     MealEntryItem?      @relation(fields: [mealEntryItemId], references: [id], onDelete: SetNull)

  entryDate         DateTime
  mealType          MealType
  quantity          Int                 @default(1)
  unitPrice         Decimal             @db.Decimal(10, 2)
  lineTotal         Decimal             @db.Decimal(10, 2)
  description       String?

  createdAt         DateTime            @default(now())

  @@index([invoiceId])
  @@index([entryDate])
}

model Payment {
  id                String              @id @default(cuid())
  ownerId           String
  owner             User                @relation("PaymentRecordedBy", fields: [ownerId], references: [id], onDelete: Cascade)

  friendId          String
  friend            Friend              @relation(fields: [friendId], references: [id], onDelete: Restrict)

  invoiceId         String?
  invoice           MonthlyInvoice?     @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

  amount            Decimal             @db.Decimal(10, 2)
  paymentMethod     PaymentMethod
  paymentStatus     PaymentStatus       @default(PENDING)
  transactionRef    String?
  notes             String?
  paidAt            DateTime?

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([ownerId, paidAt])
  @@index([friendId])
  @@index([invoiceId])
  @@index([paymentStatus])
}

model AuditTask {
  id                String              @id @default(cuid())
  title             String
  description       String?
  category          String
  status            AuditTaskStatus     @default(NOT_STARTED)
  priority          AuditPriority       @default(MEDIUM)

  ownerId           String?
  owner             User?               @relation("AuditTaskAssignedTo", fields: [ownerId], references: [id], onDelete: SetNull)

  createdById       String?
  createdBy         User?               @relation("AuditTaskCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  dueDate           DateTime?
  completedAt       DateTime?
  evidenceUrl       String?
  notes             String?

  milestoneId       String?
  milestone         AuditMilestone?     @relation(fields: [milestoneId], references: [id], onDelete: SetNull)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  activities        AuditActivityLog[]

  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([milestoneId])
}

model AuditMilestone {
  id                String              @id @default(cuid())
  title             String
  description       String?
  phaseOrder        Int
  status            MilestoneStatus     @default(NOT_STARTED)
  startDate         DateTime?
  targetDate        DateTime?
  completedAt       DateTime?

  ownerId           String?
  owner             User?               @relation("MilestoneOwner", fields: [ownerId], references: [id], onDelete: SetNull)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  tasks             AuditTask[]

  @@index([phaseOrder])
  @@index([status])
}

model AuditActivityLog {
  id                String              @id @default(cuid())
  taskId            String?
  task              AuditTask?          @relation(fields: [taskId], references: [id], onDelete: SetNull)

  userId            String?
  user              User?               @relation(fields: [userId], references: [id], onDelete: SetNull)

  action            String
  message           String?
  createdAt         DateTime            @default(now())

  @@index([taskId])
  @@index([userId])
  @@index([createdAt])
}
```

## Schema Notes

The `Friend` table is the master directory of billed people and enforces short-code uniqueness per admin owner, which prevents shorthand collisions inside one roommate group.[1] The `MealEntry` table stores the top-level context for a meal event, while `MealEntryItem` stores the person-wise lines that make billing possible.[1]

The invoice design uses both `MonthlyInvoice` and `MonthlyInvoiceItem` so the monthly bill becomes a snapshot rather than a live calculation that could silently change after edits to historical meal records.[1] This snapshot model is important for billing trust because users need month-end invoices to remain stable once issued.[1]

The audit tables are intentionally simple and map well to checklist-driven implementation tracking, where tasks can be grouped into milestones and activity logs can record state changes or links to proof of completion.[12][10]

## Audit Plan Embedded in Product Scope

The project audit system should track build progress for the application itself, not tiffin consumption.[12] This means the audit area is an engineering and delivery tracker that helps manage work such as auth setup, schema design, invoice generation, and deployment.[12][10]

### Audit Categories

- Planning.[12]
- Auth.[4]
- Database.[5]
- Friend module.[1]
- Entry module.[1]
- Billing engine.[1]
- Invoice UI.[1]
- Email integration.[6]
- QR payment integration.[7]
- Testing.[12]
- Deployment.[14]
- Documentation.[12]

### Suggested Audit Tasks

| Category      | Task                                                   | Source |
| ------------- | ------------------------------------------------------ | ------ |
| Planning      | Finalize PRD and scope freeze                          | [1]    |
| Auth          | Set up Better Auth and catch-all auth route            | [4]    |
| Database      | Create Prisma schema and migrate PostgreSQL            | [3][5] |
| Friends       | Build friend CRUD and short-code uniqueness validation | [1]    |
| Entries       | Build tick-based meal entry form                       | [1]    |
| Entries       | Build bulk shorthand parser                            | [1]    |
| Billing       | Build monthly grouping and invoice generation          | [1]    |
| Billing       | Store invoice snapshot items                           | [1]    |
| Payments      | Record payment and update due amount                   | [1]    |
| Email         | Add invoice email sending                              | [6]    |
| QR            | Add UPI QR payload and preview                         | [7]    |
| Audit         | Build task and milestone completion dashboard          | [8][9] |
| Testing       | Validate corrections, duplicates, and totals           | [1]    |
| Deployment    | Deploy app and database                                | [14]   |
| Documentation | Add README and architecture notes                      | [12]   |

### Audit Metrics

Recommended audit widgets are total tasks, completed tasks, blocked tasks, overdue tasks, milestones completed, current phase, and completion rate.[8][9][13] Completion rate is especially useful because it measures progress against planned work rather than only showing an absolute count.[9]

The core formula is:

$$
\text{Completion Rate} = \frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100
$$

This metric is aligned with task dashboard guidance that emphasizes percentage completion as a better project health signal than raw volume alone.[9][17]

## Validation Rules

- A friend short code must be unique for each owner.[1]
- A meal entry must have a date, meal type, and at least one selected friend.[1]
- Quantity must be greater than zero.[1]
- An invoice must be unique for one friend per owner per month and year, which is enforced in the schema.[1]
- Payment amount should not be negative.[1]
- Audit tasks should always have a category and status.[12][10]

## Build Phases

### Module 1: Authentication and Base Setup

Create the Next.js App Router project, connect PostgreSQL through Prisma, and integrate Better Auth using the documented catch-all auth route.[2][4][15]

### Module 2: Friends and Master Data

Build friend CRUD, owner scoping, unique short codes, and basic validation.[1]

### Module 3: Meal Entry Workflow

Build daily entry screens, itemized persistence, edit flow, and optional bulk parsing support for shorthand input.[1]

### Module 4: Billing and Invoices

Implement month grouping, invoice generation, stable invoice snapshots, and invoice detail screens.[1]

### Module 5: Payments and Communication

Add payments, due recalculation, invoice email sending, and UPI QR support.[6][7]

### Module 6: Audit and Final QA

Implement the project audit dashboard, milestones, task tracker, testing passes, and deployment documentation.[8][12]

## v1 Acceptance Criteria

A valid v1 release allows the admin to sign in, create friends, add meal entries with tick-and-quantity support, edit mistakes, view monthly totals, generate one invoice per friend for a given month, record payments, and review build progress in the audit module.[2][1] Email delivery and UPI QR support should be available or demonstrable as part of the billing workflow because they are core to the settlement use case.[6][7]

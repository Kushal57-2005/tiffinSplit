# TiffinSplit --- Multi-User Product Requirements Document

## 1. Overview

TiffinSplit is a multi-user roommate tiffin billing web application that
replaces handwritten meal notes with structured digital records for
accurate billing, payment tracking, monthly settlement, and shared
household management.

The previous product model had one **Admin / Head** who performed all
operations. That model is removed.

### Core change

There is **no Admin, Head, Owner, or privileged user** in the product.

Every authenticated member of a household/workspace has the same
permissions and can:

-   Add and manage friends/roommates
-   Enter morning and night meals
-   Edit or delete mistakes
-   View meal and billing history
-   Generate monthly invoices
-   Record payments
-   Manage household settings
-   View shared dashboard data
-   See who created or changed a record

The product should feel like a shared household ledger rather than an
admin-controlled system.

------------------------------------------------------------------------

## 2. Problem Statement

Roommate tiffin tracking is often maintained through shorthand such as:

`29 July N - S, 2K, KP, P, H, S`

This is quick to write but difficult to total, audit, correct, and
convert into monthly bills.

The multi-user version adds another problem: more than one roommate may
need to enter or correct information. A single-admin workflow creates an
unnecessary dependency on one person.

TiffinSplit solves this by storing meal events, people, invoices, and
payments as structured records in a shared workspace.

------------------------------------------------------------------------

## 3. Product Goals

1.  Make daily meal entry extremely fast.
2.  Allow every household member to perform the same core operations.
3.  Keep all users working on the same shared household data.
4.  Automatically calculate monthly totals.
5.  Make corrections easy and traceable.
6.  Generate stable monthly invoices.
7.  Track payments and outstanding balances.
8.  Support UPI payment information and invoice sharing.
9.  Show enough activity information to understand who changed a record.
10. Keep the implementation small and practical using React +
    JavaScript.

------------------------------------------------------------------------

## 4. Non-Goals for v1

-   No admin/head role.
-   No role hierarchy or permission matrix.
-   No vendor/delivery management.
-   No native mobile application.
-   No multi-company SaaS billing.
-   No complex accounting system.
-   No requirement for every friend/roommate to create an account.
-   No unnecessary enterprise permission system.

------------------------------------------------------------------------

## 5. Users and Access Model

### 5.1 Household Member

A household member is an authenticated user who belongs to a shared
TiffinSplit workspace.

All members have identical permissions.

  Action                  Any Member
  ----------------------- ------------
  View dashboard          Yes
  Add friend              Yes
  Edit friend             Yes
  Deactivate friend       Yes
  Add meal entry          Yes
  Edit meal entry         Yes
  Delete meal entry       Yes
  Generate invoice        Yes
  Record payment          Yes
  Edit payment            Yes
  Manage settings         Yes
  Invite another member   Yes
  View activity history   Yes

There is deliberately no `admin`, `head`, `manager`, or `member`
permission distinction in v1.

### 5.2 Friend / Roommate

A friend is a person whose meals are tracked for billing.

A friend does not need a login.

A friend record can optionally be linked to a registered TiffinSplit
user in the future, but v1 should not require that relationship.

------------------------------------------------------------------------

## 6. Workspace / Household Model

Because multiple users need to share the same data, all operational
records belong to a **Workspace**.

Example:

`Kushal + 4 Roommates`

The workspace contains:

-   Members
-   Friends
-   Meal entries
-   Invoices
-   Payments
-   Settings
-   Activity history

A user can belong to one or more workspaces in the future, but v1 can
keep the UI focused on one active workspace.

### Workspace creation

The first user creates a workspace during registration/setup.

That user is **not an admin**. They simply become the first member.

### Inviting members

Any existing member can invite another person.

The invited person joins with the same permissions as everyone else.

------------------------------------------------------------------------

## 7. Core Product Flows

### 7.1 Join / Workspace Flow

1.  User signs up or logs in.
2.  User creates a household/workspace or accepts an invitation.
3.  User sees the shared dashboard.
4.  No approval or admin assignment is required.

### 7.2 Daily Meal Entry

1.  Open **New Entry**.
2.  Select date.
3.  Select `Morning` or `Night`.
4.  Set/default the tiffin price.
5.  Tick the friends who received tiffin.
6.  Enter quantity for each selected person.
7.  Save.
8.  Record creator and timestamp automatically.

Example:

  Friend     Quantity   Price   Total
  -------- ---------- ------- -------
  S                 1     ₹40     ₹40
  KP                2     ₹40     ₹80
  P                 1     ₹40     ₹40

### 7.3 Correction Flow

Any member can open an existing entry and correct:

-   Date
-   Meal type
-   Friend
-   Quantity
-   Unit price
-   Notes

The system should update totals automatically.

The activity history should record:

-   Who changed it
-   What type of action occurred
-   When it happened

### 7.4 Monthly Billing

1.  Select month/year.
2.  Preview totals.
3.  Review each friend's amount.
4.  Generate invoices.
5.  Store invoice snapshot items.
6.  Existing generated invoices should not silently change when old meal
    records are edited.

If an already-issued invoice needs correction, the product should
provide an explicit regenerate/correction action rather than silently
rewriting billing history.

### 7.5 Payment Flow

Any member can record:

-   Friend
-   Invoice
-   Amount
-   Payment method
-   Payment date
-   Transaction/reference number
-   Notes

Invoice balance updates automatically.

### 7.6 Settings Flow

Any member can update shared household settings such as:

-   Morning default rate
-   Night default rate
-   Currency
-   UPI ID
-   Payee name
-   Invoice footer
-   Other basic billing defaults

Settings changes should be visible in activity history.

------------------------------------------------------------------------

## 8. Functional Requirements

### 8.1 Authentication

The application must support:

-   Registration
-   Login
-   Logout
-   Session handling
-   Protected application routes

Authentication is for identifying users, not for assigning roles.

### 8.2 Workspace Membership

The system must support:

-   Workspace creation
-   Member invitation
-   Accept invitation
-   Member list
-   Leave workspace
-   Shared access to workspace records

Every member receives the same permissions.

### 8.3 Friend Management

Each friend should support:

-   Full name
-   Short code
-   Email (optional)
-   Phone (optional)
-   UPI ID (optional)
-   Notes
-   Active/inactive state

Short code must be unique within a workspace.

### 8.4 Meal Entry Management

Each entry supports:

-   Date
-   Meal type: Morning/Night
-   Default price
-   One or more friends
-   Quantity per friend
-   Unit price
-   Line total
-   Optional raw shorthand note
-   Optional notes
-   Created by
-   Updated by
-   Created/updated timestamps

### 8.5 Bulk Entry

Optional v1 feature.

Users can paste shorthand notes and review the parsed result before
saving.

Example:

`29 July N - S, 2K, KP, P`

The parser should never save uncertain data automatically. Unknown codes
or ambiguous quantities must be shown for confirmation.

### 8.6 Invoicing

The system must generate one invoice per friend per
workspace/month/year.

Invoice should contain:

-   Billing month
-   Friend
-   Total meals
-   Total quantity
-   Subtotal
-   Adjustment
-   Total
-   Paid amount
-   Due amount
-   Status
-   Generated by
-   Generated date
-   Email/share metadata
-   UPI information
-   Snapshot line items

### 8.7 Payments

Multiple payments may be recorded against one invoice.

Supported methods:

-   Cash
-   UPI
-   Bank transfer
-   Other

Payment records should contain:

-   Amount
-   Method
-   Status
-   Paid date
-   Transaction reference
-   Notes
-   Recorded by

### 8.8 Dashboard

The dashboard should show:

-   Total friends
-   Current month meals
-   Current month billed amount
-   Paid amount
-   Pending amount
-   Recent meal entries
-   Recent payments
-   Quick add entry
-   Generate invoice
-   Workspace member activity

### 8.9 Activity History

Because there is no admin, traceability matters.

Important actions should record:

-   User
-   Action
-   Entity type
-   Entity ID
-   Timestamp
-   Short description

Examples:

-   `Kushal added meal entry for 1 Sep — Morning`
-   `Rahul changed KP quantity from 1 to 2`
-   `Amit recorded ₹500 UPI payment`
-   `Neha generated August invoices`

The activity log is for accountability, not permission control.

------------------------------------------------------------------------

## 9. Recommended React Structure

Use **React with JavaScript only**.

Do not introduce TypeScript.

A minimal structure:

``` text
src/
  app/
  components/
  pages/
    login/
    register/
    dashboard/
    friends/
    entries/
    invoices/
    payments/
    settings/
    members/
  lib/
  services/
  hooks/
  utils/
```

If using React Router, routes can be:

``` text
/login
/register
/dashboard
/friends
/friends/new
/friends/:id
/entries
/entries/new
/entries/:id
/invoices
/invoices/generate
/invoices/:id
/payments
/settings
/members
/activity
```

Keep components feature-based and small.

Avoid creating abstractions until they are actually needed.

------------------------------------------------------------------------

## 10. Suggested Data Model

The important structural change from the old PRD is replacing `ownerId`
with `workspaceId`.

Core entities:

``` text
User
Workspace
WorkspaceMember
Invitation
Friend
MealEntry
MealEntryItem
MonthlyInvoice
MonthlyInvoiceItem
Payment
WorkspaceSetting
ActivityLog
```

### User

Stores authentication identity.

### Workspace

Represents a shared household/tiffin group.

### WorkspaceMember

Connects users to workspaces.

No role field is required for v1.

### Friend

A billed person belonging to a workspace.

### MealEntry

Parent record for one date + meal type.

### MealEntryItem

Person-wise quantity and price inside a meal entry.

### MonthlyInvoice

One monthly bill for one friend.

### MonthlyInvoiceItem

Immutable billing snapshot of the meal items used to calculate the
invoice.

### Payment

A payment made toward a friend's invoice.

### WorkspaceSetting

Shared household billing defaults.

### ActivityLog

Tracks important changes and who performed them.

------------------------------------------------------------------------

## 11. Important Multi-User Rules

1.  Every query must be scoped to the active `workspaceId`.
2.  A user can only access workspaces they belong to.
3.  Every member has the same application permissions.
4.  Never use `ownerId` to determine access.
5.  Never hide features based on an admin role.
6.  Record `createdBy`/`updatedBy` where useful for traceability.
7.  Deleting a friend should normally mean deactivation, not destructive
    deletion.
8.  Invoice snapshots should remain stable after generation.
9.  Payment totals must be derived from valid payment records.
10. Workspace settings are shared by all members.

------------------------------------------------------------------------

## 12. Validation Rules

-   Friend short code is unique within a workspace.
-   Meal entry requires date, meal type, and at least one friend.
-   Quantity must be greater than zero.
-   Unit price cannot be negative.
-   Invoice is unique per workspace + friend + month + year.
-   Payment amount cannot be negative.
-   Payment cannot exceed invoice balance unless explicitly allowed as
    an advance/credit.
-   Users cannot access records from another workspace.
-   Invitation must expire after a defined period.
-   Inactive friends cannot be selected for new entries.
-   Existing historical records for deactivated friends remain visible.

------------------------------------------------------------------------

## 13. Invoice Status

Suggested statuses:

``` text
DRAFT
GENERATED
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

Status should be calculated consistently from invoice/payment state.

------------------------------------------------------------------------

## 14. Build Phases

### Phase 1 --- React Base + Authentication

-   React JavaScript project
-   Authentication
-   Protected routes
-   Basic application shell

### Phase 2 --- Workspace + Members

-   Workspace creation
-   Invite member
-   Accept invitation
-   Shared member list
-   Workspace scoping

### Phase 3 --- Friends

-   Friend CRUD
-   Short-code validation
-   Active/inactive state

### Phase 4 --- Meal Entries

-   Fast entry form
-   Tick-based friend selection
-   Quantity support
-   Entry list
-   Edit/delete
-   Activity logging

### Phase 5 --- Billing

-   Monthly calculation
-   Invoice generation
-   Invoice snapshots
-   Invoice detail

### Phase 6 --- Payments

-   Payment entry
-   Balance calculation
-   Payment history

### Phase 7 --- Settings + Sharing

-   Shared billing settings
-   UPI information
-   Invoice sharing/email if required

### Phase 8 --- QA

Test:

-   Two or more users editing the same workspace
-   Concurrent meal entries
-   Corrections
-   Duplicate invoice generation
-   Payment calculations
-   Workspace isolation
-   Invitations
-   Deactivated friends

------------------------------------------------------------------------

## 15. v1 Acceptance Criteria

A valid v1 release must allow multiple authenticated users in the same
workspace to:

1.  Log in.
2.  View the same household dashboard.
3.  Add and manage friends.
4.  Enter morning and night meals.
5.  Assign different quantities to friends.
6.  Edit mistakes.
7.  See monthly totals.
8.  Generate monthly invoices.
9.  Record multiple payments.
10. View outstanding balances.
11. Manage shared settings.
12. Invite another user.
13. See who performed important actions.

### Most important product rule

**There is no head. There is no admin. Everyone in the workspace is
equal.**

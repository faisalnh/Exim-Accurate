# Spec Driven Development Document: Detailed Analytics for Peminjaman and Pengambilan

## 1. Status

- Document type: Spec Driven Development / Software Design Document
- Feature: Detailed Analytics
- Target user: Any authenticated user, including resource owners, admins, and department heads as viewers of overall resource usage
- Codebase reviewed: Yes
- Implementation status: Planned

## 2. Codebase Findings

This plan has been revised based on the current `Exim-Accurate` codebase.

### 2.1 Current Stack

- Framework: Next.js App Router
- UI: Mantine v7
- Charts: Recharts is already installed and used by the dashboard
- Auth: NextAuth credentials provider
- Database: PostgreSQL through Prisma
- ORM schema: `prisma/schema.prisma`

### 2.2 Current User and Department Reality

The current system does **not** have a normalized `Department` table.

Current `User` model only stores:

- `id`
- `email`
- `password`
- `role`
- `createdAt`

Some records have optional parsed text fields such as `staffDept` and `borrowerDept`, but these are derived from email patterns and are not reliable enough for analytics. Therefore, department-based analytics are explicitly excluded from the MVP scope.

For MVP, analytics should rely on reliable dimensions that already exist:

- User/staff email
- Parsed user/staff name when available
- Item code
- Item name
- Transaction type
- Transaction status
- Date/time
- Credential/account ownership

### 2.3 Existing Operational Tables Related to Analytics

#### Peminjaman / Borrowing

- `BorrowableItem`
  - Globally configured borrowable items.
  - Unique by `itemCode`.
  - Not scoped per credential after current migration design.

- `BorrowingSession`
  - Main borrowing/booking transaction.
  - Stores `borrowerEmail`, `borrowerName`, `borrowerDept`.
  - Stores `type`: `borrow`, `booking`.
  - Stores `status`: `active`, `returned`, `partial`, `booked`.
  - Stores `startsAt`, `dueAt`, `borrowedAt`, `returnedAt`.
  - Stores Accurate adjustment IDs for borrow and return.

- `BorrowingItem`
  - Item rows per borrowing session.
  - Stores `itemCode`, `itemName`, `quantity`, `returnedQty`, `returnedAt`.

- `BorrowingActivity`
  - Event-style activity table.
  - Stores `activityType`: `borrow`, `booking`, `return`.
  - Stores `occurredAt`, schedule dates, borrower email/name/dept, item quantity.
  - Has indexes on `credentialId, occurredAt` and `credentialId, itemCode, occurredAt`.

#### Pengambilan / Self Checkout

In this SDD, `Pengambilan` is confirmed to mean the existing self-checkout flow:

- `CheckoutSession`
  - Main checkout/pengambilan-like transaction.
  - Stores `staffEmail`, `staffName`, `staffDept`.
  - Stores `status`: `pending`, `completed`, `failed`.
  - Stores `createdAt`, `completedAt`, `adjustmentId`.

- `CheckoutItem`
  - Item rows per checkout session.
  - Stores `itemCode`, `itemName`, `quantity`, `scannedAt`.

Pengambilan analytics must use `CheckoutSession` and `CheckoutItem` for MVP.

### 2.4 Current Access Model

- Authenticated users own `AccurateCredentials`.
- Most API routes require authenticated session.
- Several peminjaman query routes accept `credentialId` but current global item/session queries do not consistently filter by `credentialId` because borrowable items are global and some query filters omit credential scope.
- Analytics access is confirmed to be available to anyone who can log in. No special analytics role is required for MVP.

## 3. Problem Statement

Resource owners, admins, and department heads need a detailed analytics dashboard to understand resource usage patterns from peminjaman and pengambilan activity.

Because the current product does not have a department database, the MVP must not include department-based analytics or department-based filtering. The dashboard should focus on resource usage, user/email activity, transaction status, borrowing lifecycle, checkout activity, and time-based trends.

The dashboard should answer questions such as:

- Which resources are borrowed or taken most often?
- Who uses resources most frequently by email/name?
- How many borrowed items are still active, partially returned, overdue, or returned?
- How many checkout/pengambilan transactions succeeded or failed?
- Are resources being borrowed repeatedly by the same users?
- Are returns late?
- What are the trends over time?

## 4. Goals

### 4.1 Product Goals

1. Provide department heads with actionable visibility into resource usage.
2. Support decision-making for procurement, resource allocation, and accountability.
3. Allow drill-down from charts into transaction-level records.
4. Avoid introducing a hard dependency on a department table for MVP.
5. Exclude department analytics until reliable department data exists.

### 4.2 Technical Goals

1. Add analytics APIs with reusable date/filter utilities.
2. Use Prisma aggregation and targeted queries for MVP.
3. Reuse existing Mantine and Recharts UI patterns.
4. Avoid schema changes for MVP unless needed for indexes.
5. Keep future migration path open for a normalized department/staff directory.

## 5. Non-Goals for MVP

The first version should not include:

- A normalized department management module.
- Manual staff directory management.
- Predictive analytics or ML forecasting.
- Scheduled email reports.
- Custom dashboard builder.
- External BI integration.

These can be added later.

## 6. Terminology

- Peminjaman: Borrowing or booking resources, represented by `BorrowingSession`, `BorrowingItem`, and `BorrowingActivity`.
- Pengembalian: Return of borrowed resources, represented by `BorrowingActivity.activityType = return`, `BorrowingItem.returnedQty`, and `BorrowingSession.returnedAt`.
- Pengambilan: Confirmed as the current self-checkout flow, represented by `CheckoutSession` and `CheckoutItem`.

## 7. Key Design Decision: Exclude Department Analytics from MVP

The current application does not have reliable department data. Although some records include `staffDept` or `borrowerDept`, those fields are parsed from email patterns and should not be treated as a dependable analytics dimension.

MVP analytics must not include:

- Department KPI cards
- Department charts
- Department ranking
- Department filters
- Department drill-down pages
- Department-based access control

Future versions may add department analytics after a reliable department/staff data model exists.

## 8. Proposed Dashboard Pages

### 8.1 Analytics Overview

Primary landing page for decision makers.

Recommended route:

- `/dashboard/analytics`

Recommended navigation:

- Add `Analytics` to `DashboardLayout` nav near `Peminjaman`.

KPI cards:

1. Total peminjaman sessions
2. Active borrowed sessions
3. Returned sessions
4. Partial return sessions
5. Booked sessions
6. Overdue borrowed sessions
7. Total borrowed quantity
8. Total returned quantity
9. Total pengambilan / checkout sessions
10. Total checkout quantity
11. Checkout success rate
12. Top resource
13. Top borrower/staff email

Charts:

- Peminjaman trend over time
- Pengambilan trend over time
- Borrowing status breakdown
- Checkout status breakdown
- Top resources by quantity
- Top users by quantity

### 8.2 Peminjaman Analytics

Recommended route:

- `/dashboard/analytics/peminjaman`

Metrics:

- Total sessions by `type`
- Total sessions by `status`
- Total borrowed quantity
- Total returned quantity
- Outstanding quantity
- Overdue sessions
- Average loan duration
- Average days until return for returned sessions
- Bookings by future date
- Active/partial sessions by item

Charts:

- Borrow/booking trend by day/week/month
- Status stacked bar
- Top borrowed resources
- Top borrowers
- Borrowed vs returned quantity by item
- Overdue items by item and borrower

Drill-down table columns:

- Session ID
- Borrower email
- Borrower name
- Type
- Status
- Start date
- Due date
- Borrowed date
- Returned date
- Item code
- Item name
- Quantity
- Returned quantity
- Outstanding quantity
- Overdue flag

### 8.3 Pengambilan / Self Checkout Analytics

Recommended route:

- `/dashboard/analytics/pengambilan`

Pengambilan uses the current self-checkout data from `CheckoutSession` and `CheckoutItem`.

Metrics:

- Total checkout sessions
- Completed checkout sessions
- Failed checkout sessions
- Pending checkout sessions
- Total checkout item quantity
- Unique staff emails
- Average completion time from `createdAt` to `completedAt`
- Failure rate
- Top checkout items
- Top staff emails

Charts:

- Checkout trend by day/week/month
- Checkout status breakdown
- Top checkout resources
- Top checkout users
- Failed checkout trend

Drill-down table columns:

- Checkout session ID
- Staff email
- Staff name
- Status
- Created at
- Completed at
- Completion duration
- Accurate adjustment ID
- Error message if failed
- Item code
- Item name
- Quantity
- Scanned at

### 8.4 Resource Usage Analytics

Recommended route:

- `/dashboard/analytics/resources`

Metrics:

- Top borrowed resources
- Top returned resources
- Top checkout resources
- Current outstanding quantity from active/partial borrow sessions
- Configured total stock from `BorrowableItem.totalStock`
- Estimated availability: `totalStock - outstandingQty`
- Utilization rate: `outstandingQty / totalStock`
- Repeated usage count by item

Charts:

- Top resources combined view
- Borrow vs checkout comparison by item
- Availability pressure table
- Low availability resources
- Least used borrowable resources


## 9. Filters

Global filters:

- Date range
- Credential/account
- Activity source: `peminjaman`, `pengambilan`, or `all`
- Item code/item name
- User/staff email
- Status
- Transaction type: `borrow`, `booking`, `return`, `checkout`

Default filters:

- Date range: current month
- Credential: all credentials by default, with optional credential/account filter
- Source: all

## 10. API Design

### 10.1 Shared Query Parameters

All analytics endpoints should accept:

- `startDate`: ISO date string
- `endDate`: ISO date string
- `credentialId`: optional
- `email`: optional borrower/staff email
- `itemCode`: optional
- `status`: optional
- `groupBy`: `day`, `week`, `month`

### 10.2 Endpoints

#### GET `/api/analytics/overview`

Returns summary KPIs and compact chart data.

Response sections:

- `filters`
- `peminjamanSummary`
- `pengambilanSummary`
- `resourceSummary`
- `trends`
- `topResources`
- `topUsers`

#### GET `/api/analytics/peminjaman`

Returns borrowing-specific analytics.

Response sections:

- `summary`
- `trend`
- `statusBreakdown`
- `typeBreakdown`
- `topItems`
- `topBorrowers`
- `overdue`
- `details`

#### GET `/api/analytics/pengambilan`

Returns self-checkout/pengambilan analytics from `CheckoutSession` and `CheckoutItem`.

Response sections:

- `summary`
- `trend`
- `statusBreakdown`
- `topItems`
- `topStaff`
- `failures`
- `details`

#### GET `/api/analytics/resources`

Returns item/resource-level analytics.

Response sections:

- `summary`
- `topBorrowed`
- `topCheckedOut`
- `borrowedVsReturned`
- `availabilityPressure`
- `leastUsed`
- `details`


## 11. Data Scope Notes

Department-based analytics are intentionally excluded from MVP because the system does not have reliable department data. Optional parsed fields such as `staffDept` and `borrowerDept` may remain stored for display in transaction details, but they should not be used for aggregation, filtering, KPI cards, or access control.

## 12. Access Control Requirements

### 12.1 MVP Access

Analytics is visible to anyone who can log in.

MVP access rules:

1. Unauthenticated users cannot access analytics.
2. Any authenticated user can view the analytics dashboard.
3. No admin-only or resource-owner-only restriction is required for MVP.
4. Do not use `borrowerDept` or `staffDept` as an authorization boundary.
5. Do not expose department filters or department-level analytics in MVP.

### 12.2 Future Access

After adding a staff/department directory, department heads can be linked to department IDs and scoped dashboards can be designed as a separate future feature.

## 13. Query and Aggregation Strategy

### 13.1 MVP Strategy

Use real-time Prisma queries with aggregation and small result windows.

Recommended default date range:

- Current month

Recommended maximum date range for interactive dashboard queries:

- 1 year

Export is not required for MVP. If export support is added later, large exports should be paginated or processed asynchronously.

### 13.2 Important Query Rules

- Always validate authenticated session.
- Any authenticated user can access analytics data for MVP.
- If `credentialId` is provided, validate that the credential exists before applying it as a filter.
- If `credentialId` is not provided, aggregate across all credentials.
- Apply `credentialId` filters to `BorrowingSession`, `BorrowingActivity`, and `CheckoutSession` analytics queries when selected.
- Be careful with `BorrowableItem`, because it is currently global by `itemCode` and not credential-scoped.

## 14. Performance and Indexing

Current useful indexes:

- `BorrowingActivity`: `credentialId, occurredAt`
- `BorrowingActivity`: `credentialId, itemCode, occurredAt`

Recommended additional indexes for analytics-heavy usage:

- `BorrowingSession(credentialId, borrowedAt)`
- `BorrowingSession(credentialId, startsAt)`
- `BorrowingSession(credentialId, dueAt)`
- `BorrowingSession(credentialId, status)`
- `BorrowingSession(borrowerEmail)`
- `BorrowingItem(itemCode)`
- `CheckoutSession(credentialId, createdAt)`
- `CheckoutSession(credentialId, completedAt)`
- `CheckoutSession(credentialId, status)`
- `CheckoutSession(staffEmail)`
- `CheckoutItem(itemCode)`

These indexes can be added in a dedicated migration if analytics queries become slow.

## 15. UI/UX Requirements

### 15.1 General UI

Use Mantine components consistent with the current dashboard:

- `Stack`
- `Group`
- `SimpleGrid`
- `Paper` / `Card`
- `Badge`
- `Select`
- `DatePicker`
- `Table`
- `Skeleton`
- `EmptyState`
- Existing `StatsCard` where possible

Use Recharts for:

- Area charts
- Bar charts
- Stacked bar charts
- Pie/donut charts if desired

### 15.2 Drill-Down Behavior

Users should be able to click:

- KPI cards
- Chart bars
- Chart segments
- Resource rows

Clicking should apply filters and update the details table.

## 16. Suggested MVP Build Plan

### Phase 1: Analytics Foundations

Deliverables:

1. Create analytics utility module.
2. Implement date parsing and validation utilities.
3. Implement credential ownership helper.
4. Implement shared response types.

Candidate files:

- `lib/analytics.ts`
- `types/analytics.ts`

### Phase 2: Backend APIs

Deliverables:

1. `GET /api/analytics/overview`
2. `GET /api/analytics/peminjaman`
3. `GET /api/analytics/pengambilan`
4. `GET /api/analytics/resources`

Candidate files:

- `app/api/analytics/overview/route.ts`
- `app/api/analytics/peminjaman/route.ts`
- `app/api/analytics/pengambilan/route.ts`
- `app/api/analytics/resources/route.ts`

### Phase 3: Frontend Dashboard

Deliverables:

1. Add analytics nav item.
2. Create analytics overview page.
3. Create peminjaman tab/page.
4. Create pengambilan tab/page.
5. Create resources tab/page.
6. Add filters and drill-down table.

Candidate files:

- `app/dashboard/analytics/page.tsx`
- `app/dashboard/analytics/peminjaman/page.tsx`
- `app/dashboard/analytics/pengambilan/page.tsx`
- `app/dashboard/analytics/resources/page.tsx`

### Phase 4: Hardening

Deliverables:

1. Add tests/type checks.
2. Add empty states.
3. Add query safeguards for long date ranges.
4. Add optional indexes if needed.
5. Validate no cross-credential data leakage.

## 17. Acceptance Criteria

### 17.1 Overview Dashboard

- Shows total peminjaman, pengambilan, top resources, and top users.
- Defaults to the current month.
- Supports date range filtering.
- Shows empty state when no data exists.
- Does not show department-based analytics.

### 17.2 Peminjaman Analytics

- Shows borrow/booking/return trends.
- Shows status breakdown.
- Shows active, partial, returned, booked, and overdue metrics.
- Defines overdue as active/partial sessions where `dueAt < now`.
- Shows booking records separately from borrow records by default.
- Allows drill-down into session/item records.

### 17.3 Pengambilan Analytics

- Shows checkout trend and status breakdown.
- Shows top checkout resources and staff emails.
- Allows drill-down into checkout/item records.
- Clearly identifies this as self-checkout data.


### 17.4 Security

- Unauthenticated users receive 401.
- Any authenticated user can view analytics.
- APIs validate all query parameters.

## 18. Risks

### 18.1 Query Scope Clarity

Risk: Analytics data is confirmed to be visible to any authenticated user, while some existing routes use credential ownership patterns. Implementation could accidentally mix access models.

Mitigation:

- Analytics endpoints must centralize the confirmed analytics access rule: authenticated users can view analytics.
- If a credential filter is selected, validate that the credential exists before filtering.
- Add tests/manual checks for unauthenticated access and credential filtering behavior.

### 18.2 Slow Aggregations

Risk: Real-time analytics queries can become slow with large data.

Mitigation:

- Use current month as the default range.
- Add indexes.
- Add materialized summary tables later if needed.

## 19. Future Enhancements

1. Add `Department` and `StaffProfile` database models if department analytics becomes required later.
2. Add department-head role and assigned departments after reliable department data exists.
3. Add scheduled monthly reports.
4. Add export support if needed later.
5. Add procurement recommendations.
6. Add low-availability alerts.
7. Add historical monthly summary tables.
8. Add PDF executive report if export/reporting becomes required later.

## 20. Confirmed Decisions

1. `Pengambilan` means the current self-checkout flow using `CheckoutSession` and `CheckoutItem`, not pickup/collection related to `BorrowingSession`.
2. Analytics is visible to anyone who can log in.
3. The default dashboard period is the current month.
4. Export is not required for MVP.
5. Overdue peminjaman is defined as active/partial sessions where `dueAt < now`.
6. Booking records should be shown separately from borrow records by default.

# Workshop Document Management System

## Overview
Heavy equipment workshop document management web app for CV UTAMA SINERGI BERKARYA (Banda Aceh). Admin creates Quotations (QUO/10000), inputs client Purchase Orders, creates Work Orders (WO/10000), and generates Invoices (INV/10000). All three documents auto-link via the same project number. Technicians log in to accept and complete WOs, inputting actual expenditure costs. Dashboard shows profit/loss per project.

## Architecture
- Full-stack TypeScript app: Express backend + React (Vite) frontend
- PostgreSQL database with Drizzle ORM
- Replit Auth for authentication (admin/technician roles)
- Object Storage integration (PO file uploads)
- PDF generation via jsPDF + jspdf-autotable (client-side)

## User System
- Users get auto-generated 4-digit employee IDs (starting from 1001)
- Users can set their display name via Profile page (`/profile`)
- Admin selects technicians by employee ID + name in WO form
- Employee ID is assigned on first login and cannot be changed

## Key Files
- `shared/schema.ts` - Re-exports from models
- `shared/models/auth.ts` - Users and sessions tables
- `shared/models/documents.ts` - All document tables (clients, quotations, quotation_items, purchase_orders, work_orders, wo_items, tech_expenditures, invoices, invoice_items)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database storage interface and implementation
- `client/src/App.tsx` - Frontend routing (admin vs technician views)
- `client/src/lib/constants.ts` - Company info, bank accounts, formatCurrency
- `client/src/lib/pdf-generator.ts` - PDF generation for QUO, WO, INV
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/pages/` - All page components

## Document Flow
1. Admin creates Quotation → gets project number (QUO/10000)
2. Client sends Purchase Order → admin inputs it linked to project number
3. Admin creates Work Order → linked to same project number (WO/10000)
4. Technician accepts WO → status: processing
5. Technician completes WO → adds expenditure rows (description + cost, auto-totaled) → status: completed
6. Admin creates Invoice → linked to same project number (INV/10000)
7. Admin marks Invoice as Paid → profit/loss appears on dashboard

## Invoice Status
- Invoices start as "draft" (displayed as "Unpaid")
- Admin can mark as "paid" via the invoice detail page
- Endpoint: `PATCH /api/invoices/:id/mark-paid`

## Profit/Loss Calculation
`Profit = Quote Amount - WO Budget - Technician Cost`
- Profit/loss only displays on dashboard when the invoice is marked as "paid"
- Total Profit summary card only sums projects with paid invoices

## Roles
- **admin**: Full access to all documents, dashboard, user management
- **technician**: Can only see assigned WOs, accept/complete them

## Database
- PostgreSQL via Drizzle ORM
- Schema push: `npm run db:push`
- First user gets "technician" role by default; change to "admin" via Users page or DB

## Company Details
- CV UTAMA SINERGI BERKARYA
- Jl. Khairil Anwar No.32, Banda Aceh
- Director: RIZKI JUANDA
- Bank accounts: MAYBANK SYARIAH (8707036469), BANK ACEH SYARIAH (01502200034451)

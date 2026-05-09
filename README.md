# Heavy Equipment Flow — Workshop Management System

**CV UTAMA SINERGI BERKARYA**

Aplikasi manajemen dokumen bengkel alat berat. Mengelola Quotation, Work Order, Purchase Order, dan Invoice dalam satu sistem.

---

## Tech Stack

| Layer    | Teknologi                          |
| -------- | ---------------------------------- |
| Frontend | React 18, Vite 7, Tailwind 3, shadcn/ui, wouter |
| Backend  | Express 5, Node.js 24 (ESM)       |
| Database | PostgreSQL 16, Drizzle ORM         |
| Auth     | Passport.js (Local Strategy), express-session, connect-pg-simple |

---

## Fitur

### 🔐 Authentication & User Management
- [x] Login dengan email & password
- [x] Self-registration **DINONAKTIFKAN** — hanya master yg bisa buat akun
- [x] Session-based auth (7 hari), disimpan di PostgreSQL
- [x] Tiga role: **master** → **admin** → **technician**

### 👑 Master Account
- [x] Buat akun baru (email + password + employee ID + role)
- [x] Hapus akun user (konfirmasi ketik `delete` — tidak bisa hapus sesama master)
- [x] Kelola role user (admin ↔ technician)
- [x] User pertama auto jadi master

### 👤 Technician
- [x] Lihat Work Order yg di-assign ke dia
- [x] Terima WO (ubah status ke processing)
- [x] Selesaikan WO (input biaya teknis, hitung profit/loss)
- [x] Lihat & edit profile sendiri

### 📄 Quotations (QUO)
- [x] CRUD lengkap (create, read, update, delete)
- [x] Nomor project auto-increment
- [x] Multiple line items
- [x] Link ke client
- [x] Format PDF export (jsPDF + autoTable)

### 🔧 Work Orders (WO)
- [x] CRUD + status tracking (pending → processing → completed)
- [x] Assign ke technician
- [x] Line items dari quotation
- [x] Input biaya teknisi (expenditure)
- [x] Format PDF export

### 📦 Purchase Orders (PO)
- [x] CRUD
- [x] Link ke project
- [x] Format PDF export

### 🧾 Invoices (INV)
- [x] CRUD + status (unpaid ↔ paid)
- [x] Mark as paid dengan satu klik
- [x] Line items
- [x] Format PDF export

### 🔍 Search
- [x] Search by project number atau client name
- [x] Cross-document type (QUO, WO, INV, PO)

### 📊 Dashboard
- [x] Ringkasan: total project, active WO, revenue, profit
- [x] Tabel project tracking (status, anggaran, profit/loss per project)

### 👥 Clients
- [x] CRUD client
- [x] Search client
- [x] Link ke semua dokumen

### 🌓 UI/UX
- [x] Light & dark mode
- [x] Responsive (mobile friendly)
- [x] Collapsible sidebar
- [x] Toast notifications
- [x] Loading skeletons

---

## Progress

```
✅ Auth system (login, session, role-based access)
✅ Master account management
✅ CRUD Quotations + PDF
✅ CRUD Work Orders + PDF + expenditure tracking
✅ CRUD Purchase Orders + PDF
✅ CRUD Invoices + PDF + mark paid
✅ Client management
✅ Dashboard + project tracking
✅ Search across documents
✅ Delete user with typed confirmation
✅ Public registration disabled
✅ Dark mode
✅ Mobile responsive
⬜ Deployment (Vercel)
⬜ Email notifications
⬜ Activity logs
⬜ File uploads (Uppy)
```

---

## Local Development

### Prasyarat
- Node.js 24+
- PostgreSQL 16 (database: `heavy_equipment`, user: `postgres`, password: `jungtaewo`)
- Atau Docker: `docker run --name heavy-equip-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=jungtaewo -e POSTGRES_DB=heavy_equipment -p 5432:5432 -d postgres:16`

### Setup
```bash
npm install
npm run db:push     # migrate database tables
npm run dev         # start dev server → http://localhost:5000
```

### Notes
- User pertama yg di-insert manual (atau yg sudah ada) auto jadi **master**
- Ga ada halaman register — user harus dibuat oleh master
- Dev server jalan di `127.0.0.1:5000`, bukan `0.0.0.0`

---

## Timezone

Server & database: UTC  
Created: 2026-05-08

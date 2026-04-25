# Solara 2026 CRM

![Solara 2026 Banner](https://img.shields.io/badge/Solara_2026-Clean_Energy-FFB800?style=for-the-badge&logo=solar-panel&logoColor=black)

**Solara 2026** is a comprehensive, modern Customer Relationship Management (CRM) and Service Workflow platform designed for the solar energy sector in Algeria. It provides an end-to-end digital experience for both clients requesting solar installations and administrators managing technical operations.

## 🌟 Project Purpose (Graduation Defense)

### What problem does Solara solve?
Before Solara, managing solar energy installations and maintenance requests was a fragmented process. Clients lacked visibility into their project's status, and technical teams struggled to track site visits, price quotes, and installation schedules systematically.

Solara centralizes this entire lifecycle. It provides:
1. **For Clients:** A transparent, frictionless portal to submit requests, sign in seamlessly via Google/Facebook, and track the exact status of their solar installations or maintenance tickets.
2. **For Administrators:** A powerful Kanban-style dashboard to track operations, assign technicians, maintain internal notes, and seamlessly push automated email updates to clients as projects progress.

### Why the Workflow System Matters
The core of Solara is its strict **State Machine Workflow**. Requests cannot jump statuses arbitrarily. A request must pass through logical stages (e.g., *Site Visit* -> *Inspection Done* -> *Quote Prepared* -> *Awaiting Approval*). This prevents operational errors, ensures clients are billed correctly, and provides a fully immutable audit timeline for every project.

---

## 🚀 Main Features

*   **Dual Request Types**: Unified handling of both New Installations and System Maintenance.
*   **Immutable Timelines**: Every status change is recorded with timestamps, the responsible user, and notes.
*   **Modern Authentication**: Local Email/Password alongside secure **Google One Tap** and **Facebook OAuth**.
*   **Automated Email Notifications**: Clients automatically receive branded Arabic HTML emails when their project advances.
*   **Role-Based Security**: Strict separation of concerns. Clients cannot access administrative endpoints, and admins cannot bypass security by logging in via social providers.

---

## 👥 User Roles

### 1. Client Workflow
- **Registration**: Can register manually or instantly via Google/Facebook.
- **Portal**: Dedicated secure dashboard.
- **Actions**: Submit requests (Installation/Maintenance), track real-time status, and view history.

### 2. Admin Workflow
- **Dashboard**: Global overview of all requests, statistics, and monthly trends.
- **Actions**: Advance request statuses, assign technicians, write internal (private) notes, and view full project timelines.

---

## 🔄 Request Lifecycles

### Installation Lifecycle
1. `new_request` (طلب جديد)
2. `under_review` (قيد المراجعة)
3. `site_visit_scheduled` (تم جدولة زيارة ميدانية)
4. `site_inspection_done` (تمت المعاينة)
5. `quote_prepared` (تم تجهيز العرض)
6. `awaiting_client_approval` (في انتظار الموافقة)
7. `approved` (تمت الموافقة)
8. `installation_scheduled` (تم جدولة التركيب)
9. `in_progress` (قيد التنفيذ)
10. `completed` (مكتمل)
11. `follow_up` (متابعة)

### Maintenance Lifecycle
1. `new_request` (طلب جديد)
2. `initial_diagnosis` (التشخيص الأولي)
3. `visit_scheduled` (تم جدولة زيارة)
4. `in_progress` (قيد التنفيذ)
5. `resolved` (تم الحل)
6. `closed` (مغلق)

---

## 🛠️ Technologies Used

*   **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism UI), JavaScript.
*   **Backend**: Node.js, Express.js.
*   **Database**: SQLite (Zero-config, portable relational database).
*   **Security**: JWT (JSON Web Tokens), Bcrypt (Password Hashing), Google Auth Library.
*   **Email**: Nodemailer for automated SMTP updates.

---

## 💻 How to Run Locally

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd solara-2026-v2
   npm install
   ```

2. **Environment Configuration:**
   Copy the `.env.example` file to `.env` and fill in your credentials.

3. **Start the Server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

### Default Admin Setup
On first boot, the system automatically creates a default admin account:
*   **Email**: `admin@solara2026.dz`
*   **Password**: `admin123`

*(Note: Change this immediately in a production environment)*

---

## ⚙️ Environment Variables & Setup

Create a `.env` file in the root directory:

```env
PORT=3000

# Google OAuth (Required for Social Login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# SMTP Configuration (Required for Email Notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-secure-password
SMTP_FROM=noreply@solara2026.dz
PORTAL_URL=http://localhost:3000/portal.html
```

### Google Login Setup
1. Go to Google Cloud Console > APIs & Services > Credentials.
2. Create an OAuth 2.0 Client ID for Web Applications.
3. Add `http://localhost:3000` to Authorized JavaScript origins.
4. Copy the Client ID to your `.env` file.

### Email Setup (SMTP)
The system uses Nodemailer. You can use Gmail (with an App Password), SendGrid, or any standard SMTP server. If the variables are missing, the system **will safely disable emails without crashing**.

---

## 🔮 Future Improvements
- Migration to a fully managed database (e.g., PostgreSQL) for massive scalability.
- Native mobile application wrapped around the portal API.
- Live Chat support integration for real-time customer service.
- PDF Generator for exporting Quotes directly from the dashboard.

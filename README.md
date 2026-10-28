# Workly — Employee Management System

A full-stack Employee Management System built with Django REST Framework and React. Designed as a professional HR software product for small and medium-sized companies.

![Tech Stack](https://img.shields.io/badge/Django-6.1-092E20?logo=django)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | KPI cards, headcount trends, department distribution, recent hires, upcoming birthdays |
| **Employees** | Full directory with search, filters, pagination, profile pages, CSV export |
| **Departments** | Department management with member listing and head assignments |
| **Attendance** | Check-in/out, daily status, admin summary, history with export |
| **Leave Management** | Leave types, balances, request/approve/reject workflow |
| **Payroll** | Payroll records, salary breakdowns, process and payment workflow |
| **Performance** | Goals with progress tracking |
| **Recruitment** | Job openings and candidate pipeline tracking |
| **Onboarding** | Onboarding task management |
| **Tasks** | Task assignment, priority, status tracking |
| **Reports** | Analytics dashboards for attendance, leave, payroll with charts |
| **Announcements** | Company-wide announcements with publish/draft management |
| **Notifications** | In-app notification system with unread tracking |
| **Settings** | Company info, work schedules, holidays, password change |

### Role-Based Access Control

| Role | Access |
|---|---|
| **Admin** | Full system access — all modules, settings, and reports |
| **HR Manager** | Employee management, leave approvals, recruitment, performance |
| **Employee** | Own profile, attendance, leave requests, tasks, announcements |

---

## Tech Stack

### Backend
- Python 3.13 / Django 6.1 / Django REST Framework 3.18
- JWT authentication (SimpleJWT)
- PostgreSQL (SQLite for development)
- drf-spectacular for OpenAPI docs

### Frontend
- React 19 / Vite 8
- Tailwind CSS 4
- Recharts for data visualization
- Lucide React icons
- React Router, Axios, React Hook Form, Zod, date-fns

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optional — SQLite works for development)

### 1. Clone and set up backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — for development, the default SQLite config works out of the box
```

### 3. Initialize database

```bash
python manage.py migrate
python manage.py create_dev_users
python manage.py seed_data
```

### 4. Set up frontend

```bash
cd ../frontend
npm install
```

### 5. Run development servers

Terminal 1 (backend):
```bash
cd backend
python manage.py runserver 8000
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123!@#` |
| HR Manager | `hr_manager` | `hr123!@#` |
| Employee | `employee1` | `emp123!@#` |

---

## API Documentation

With the backend running, visit:
- **Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **OpenAPI Schema**: [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)

### Key Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/auth/login/` | JWT login |
| `GET /api/auth/me/` | Current user profile |
| `GET /api/employees/` | Employee directory |
| `GET /api/departments/` | Department list |
| `GET /api/attendance/` | Attendance records |
| `GET /api/leaves/requests/` | Leave requests |
| `GET /api/payroll/records/` | Payroll records |
| `GET /api/reports/dashboard/` | Dashboard data |
| `GET /api/reports/reports/?type=overview` | Reports API |
| `GET /api/core/settings/` | Company settings |

---

## Seed Data

The `seed_data` management command creates:
- 30 employees across 10 departments and 26 designations
- 4 leave types with balances for all employees
- 18 leave requests (mix of pending, approved, rejected)
- 435 attendance records (past 3 weeks)
- 87 payroll records (3 months)
- 15 tasks, 10 performance goals
- 5 job openings with 10 candidates
- 12 notifications, 5 announcements
- 8 company holidays, 2 work schedules
- Company settings for "Meridian Technologies"

---

## Project Structure

```
├── backend/
│   ├── config/              # Django project settings, urls, wsgi
│   ├── apps/
│   │   ├── accounts/        # Custom user model, auth views, permissions
│   │   ├── employees/       # Employee CRUD, profiles, documents
│   │   ├── departments/     # Departments and designations
│   │   ├── attendance/      # Check-in/out, attendance records
│   │   ├── leaves/          # Leave types, balances, requests
│   │   ├── payroll/         # Payroll records, salary revisions
│   │   ├── performance/     # Goals and reviews
│   │   ├── recruitment/     # Job openings and candidates
│   │   ├── onboarding/      # Onboarding tasks and templates
│   │   ├── tasks/           # Task management
│   │   ├── notifications/   # Notifications and announcements
│   │   ├── reports/         # Dashboard and analytics APIs
│   │   └── core/            # Company settings, holidays, schedules
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance with JWT interceptor
│   │   ├── components/      # Layout (Sidebar, Topbar), shared components
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # 13 page modules
│   │   ├── routes/          # ProtectedRoute
│   │   └── utils/           # Utilities (cn)
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

---

## Deployment

### Backend (Production)

```bash
# Set environment variables
DEBUG=False
SECRET_KEY=<strong-random-key>
DATABASE_URL=postgres://user:pass@host:5432/ems_db
ALLOWED_HOSTS=yourdomain.com

# Collect static files
python manage.py collectstatic --noinput

# Run with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Frontend (Production)

```bash
cd frontend
npm run build
# Serve the dist/ folder with Nginx, Caddy, or any static file server
```

### PostgreSQL Setup

```bash
# Create database
createdb ems_db
# Update .env
DATABASE_URL=postgres://username:password@localhost:5432/ems_db
# Run migrations
python manage.py migrate
```

---

## License

MIT

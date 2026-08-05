# CampusFlow — Assignment & Submission Management System

A role-based full-stack app for a school/college: **Teachers** create and grade assignments,
**Students** submit and track their work, and **Admins** manage the platform. Built for the
OnnoRokom Projukti Assistant Software Engineer recruitment project.

## 🎥 Demo Video

Watch the complete project walkthrough here:

**https://youtu.be/bYuc2Nl8gS4**

> The video demonstrates the complete workflow, including authentication, role-based dashboards, assignment creation, submissions, grading, analytics, notifications, AI-powered features, and the deployed application.

## 🌐 Live Demo

| | URL |
|---|---|
| **Frontend** | https://campus-flow-beryl.vercel.app |
| **Backend API** | https://campusflow-backend-wune.onrender.com |
| **Swagger docs** | https://campusflow-backend-wune.onrender.com/swagger |

Deployed on Vercel (frontend) + Render (backend) + MongoDB Atlas (database) — verified working
end-to-end (login, dashboards, CORS). See [Demo credentials](#demo-credentials) to log in.

> Render's free tier sleeps after inactivity — the first request after a while may take ~30–60s to wake up.

## Quick start — run it locally (Docker)

This is the primary, required setup — no cloud accounts needed.

```bash
git clone https://github.com/ProvaPaul/CampusFLOW
cd CampusFlow
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:5000
- Swagger → http://localhost:5000/swagger

MongoDB, backend, and frontend all start together. Indexes and demo data are seeded automatically
on first boot — no manual database setup. To reset: `docker compose down -v`.

**Prefer running without Docker?** See [Manual setup](#manual-setup) below.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campusflow.edu` | `Admin@123` |
| Teacher | `teacher1@campusflow.edu` | `Teacher@123` |
| Teacher | `teacher2@campusflow.edu` | `Teacher@123` |
| Student | `student1@campusflow.edu` | `Student@123` |
| Student | `student2@campusflow.edu` | `Student@123` |
| Student | `student3@campusflow.edu` | `Student@123` |

The login page also has one-click buttons that fill these in for you.

## Main features

- JWT authentication with role-based authorization (Admin / Teacher / Student) on every endpoint.
- **Admin** — manage users, classes, subjects, and teacher assignments; view all assignments/submissions.
- **Teacher** — create/edit/delete assignments, publish or save as draft, grade submissions with marks + feedback.
- **Student** — view assignments for their class, submit answers, update before the deadline, see grades/feedback.
- Centralized validation and error handling, structured logging (Serilog), Swagger/OpenAPI docs.
- Responsive UI with client-side validation (Zod + React Hook Form).
- Seeded demo data — usable immediately, zero manual setup.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, React Hook Form + Zod |
| Backend | ASP.NET Core 8 Web API (C#), Clean Architecture + Repository pattern |
| Database | MongoDB (local via Docker, or MongoDB Atlas in production) |
| Auth | JWT bearer tokens, BCrypt password hashing |
| Testing | xUnit, Moq, FluentAssertions |
| Deployment | Docker Compose (local) · Vercel + Render + Atlas (live) |

## Project structure

```
CampusFlow/
├── backend/
│   ├── src/
│   │   ├── CampusFlow.Domain/          # Entities & enums
│   │   ├── CampusFlow.Application/     # Business logic, DTOs, validators
│   │   ├── CampusFlow.Infrastructure/  # MongoDB repositories, JWT, DB seeder
│   │   └── CampusFlow.Api/             # Controllers, Program.cs, Swagger
│   └── tests/                          # xUnit unit tests
├── frontend/
│   └── src/
│       ├── app/                        # Pages: login, admin/, teacher/, student/
│       ├── components/                 # Reusable UI + layout components
│       └── lib/                        # API client, auth context, types
├── docker-compose.yml
└── render.yaml                         # Render Blueprint for live deployment
```

**Why Clean Architecture?** Business rules live in `Application` behind interfaces, so they're unit
tested without a real database. `Infrastructure` implements those interfaces against MongoDB —
swappable without touching business logic. Controllers in `Api` stay thin.

## Data model

MongoDB document references (not SQL foreign keys):

```
User (Admin | Teacher | Student) ── ClassId → Class (Students only)
Subject ── ClassId → Class
TeacherAssignment ── TeacherId → User, SubjectId → Subject, ClassId → Class
Assignment ── ClassId → Class, SubjectId → Subject, TeacherId → User
Submission ── AssignmentId → Assignment, StudentId → User
```

A unique index on `users.email` is created automatically at startup.

## Manual setup

Prefer running natively instead of Docker? You'll need [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0), [Node.js 20+](https://nodejs.org/), and a MongoDB instance (`docker run -d -p 27017:27017 mongo:7` works fine).

```bash
# Backend
cd backend
dotnet restore
dotnet run --project src/CampusFlow.Api    # http://localhost:5000, Swagger at /swagger

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                                 # http://localhost:3000
```

Every config value (`MongoDb__ConnectionString`, `Jwt__Key`, etc.) can be overridden via environment
variables — see `backend/.env.example` and `frontend/.env.example`.

## Running tests

```bash
cd backend && dotnet test
```

Covers authentication, role/ownership authorization (e.g. a teacher can't grade another teacher's
assignment), and the submission workflow (late submissions, duplicate prevention, deadline/grading
edge cases) — using in-memory repository fakes, no real database needed.

## Business rules enforced by the API

- A teacher can only create assignments for a subject/class they're assigned to teach.
- Only an assignment's owning teacher can edit, publish, grade, or change its submissions' status.
- Students only see **published** assignments for **their own class**.
- A student can submit once, then must update their existing submission (no duplicates).
- Late submissions are accepted but flagged `Late`, not rejected.
- A submission can only be edited before the deadline, if resubmission is allowed, and never after grading.
- Marks can't exceed an assignment's configured maximum.

## Key assumptions

- No public sign-up — Admins create Teacher/Student accounts.
- A Teacher may only teach a subject/class they've been explicitly assigned to (`TeacherAssignment`).
- Late submissions are accepted (flagged `Late`) rather than blocked — more realistic for a school tool.
- File attachments are a URL field, not binary upload/storage.
- Admin doesn't create/grade assignments (scoped to Teachers); Admin can delete any assignment.
- JWT is stored in `localStorage` for simplicity — a real production app would use httpOnly cookies.

## Known limitations

- No controller-level integration tests (business logic is fully covered at the Application layer).
- No refresh-token flow — JWT expires after 120 minutes, user logs in again.
- No file upload storage, no pagination on list endpoints, no email notifications.
- No public "Sign up" page by design.

## Deploying your own copy

**Local (Docker)** — see [Quick start](#quick-start--run-it-locally-docker) above. No cloud accounts needed.

**Live (Vercel + Render + Atlas)** — same code, only environment variables differ:

1. **MongoDB Atlas** — create a free cluster, add a DB user, allow network access from `0.0.0.0/0`, copy the `mongodb+srv://...` connection string.
2. **Render (backend)** — "New +" → "Blueprint", point at this repo. It reads [`render.yaml`](render.yaml) and prompts for `MongoDb__ConnectionString` (from step 1), `Cors__AllowedOrigins__0` (your Vercel URL — set after step 3), and an optional `Ai__ApiKey`.
3. **Vercel (frontend)** — import this repo, root directory `frontend`, set `NEXT_PUBLIC_API_URL` to your Render URL, deploy.
4. Go back to Render and update `Cors__AllowedOrigins__0` to your real Vercel URL, then redeploy.

AI features (optional) degrade gracefully with no key configured — `GET /api/ai/status` reports
`{"enabled":false}` and the frontend hides those actions instead of erroring.

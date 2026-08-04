# CampusFlow — Assignment & Submission Management System

A role-based, full-stack web application for a school/college that lets **Teachers** create and grade
assignments, **Students** submit and track their work, and **Admins** manage the overall platform
(users, classes, subjects, and teacher-subject assignments).

Built for the OnnoRokom Projukti Assistant Software Engineer recruitment project.

## Table of contents

- [Overview](#overview)
- [Main features](#main-features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Quick start (Docker Compose)](#quick-start-docker-compose)
- [Manual setup](#manual-setup)
  - [Database](#1-database-mongodb)
  - [Backend](#2-backend-aspnet-core-web-api)
  - [Frontend](#3-frontend-nextjs)
- [Demo credentials](#demo-credentials)
- [Running tests](#running-tests)
- [API documentation](#api-documentation)
- [Business rules enforced by the API](#business-rules-enforced-by-the-api)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)

## Overview

CampusFlow implements the full assignment lifecycle:

1. An **Admin** creates classes/courses, subjects, teacher and student accounts, and assigns
   teachers to a subject within a class.
2. A **Teacher** who is assigned to that subject/class creates an assignment (title, description,
   deadline, max marks), and publishes it (or keeps it as a draft).
3. A **Student** in that class sees the published assignment, submits an answer, and can update it
   before the deadline if the teacher allows resubmission.
4. The **Teacher** reviews submissions, assigns marks and feedback, and can change a submission's
   status (e.g. mark it for revision).
5. The **Student** sees their status, marks, and feedback once graded.

## Main features

- JWT-based authentication with role-based authorization (Admin / Teacher / Student) enforced on
  every API endpoint.
- Admin: manage users, classes/courses, subjects, and teacher-subject-class assignments; read-only
  view of all assignments/submissions platform-wide.
- Teacher: create/update/delete assignments scoped to subjects they're assigned to teach; publish or
  keep as draft; view and grade submissions; change submission status.
- Student: view assignments for their own class; submit an answer; update a submission before the
  deadline (if the teacher allows it); view status, marks, and feedback.
- Centralized validation (FluentValidation) and centralized error handling that returns consistent,
  structured JSON error responses.
- Structured logging (Serilog) to console and rolling log files.
- Swagger/OpenAPI docs with JWT "Authorize" support.
- Seeded demo data so the app is usable immediately after first run — no manual DB setup required.
- Responsive, modern UI (Tailwind CSS) with client-side form validation (Zod + React Hook Form).

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, React Hook Form + Zod, Axios |
| Backend | ASP.NET Core 8 Web API, C#, Clean Architecture, Repository pattern |
| Database | MongoDB (official `MongoDB.Driver`) |
| Auth | JWT bearer tokens, BCrypt password hashing, role-based `[Authorize]` policies |
| Validation | FluentValidation (backend), Zod (frontend) |
| Logging | Serilog (console + rolling file sink) |
| API docs | Swagger / OpenAPI (Swashbuckle) |
| Testing | xUnit, Moq, FluentAssertions |
| Containerization | Docker, Docker Compose |

## Project structure

```
CampusFlow/
├── backend/
│   ├── CampusFlow.sln
│   ├── Dockerfile
│   ├── src/
│   │   ├── CampusFlow.Domain/          # Entities & enums — no external dependencies
│   │   ├── CampusFlow.Application/     # DTOs, service interfaces & implementations,
│   │   │                                 FluentValidation validators, business rules
│   │   ├── CampusFlow.Infrastructure/  # MongoDB repositories, JWT, password hashing, DB seeder
│   │   └── CampusFlow.Api/             # Controllers, Program.cs, middleware, Swagger, DI wiring
│   └── tests/
│       └── CampusFlow.Application.Tests/  # xUnit unit tests (business rules, authorization,
│                                             submission workflow) with in-memory repository fakes
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/
│       │   ├── login/                  # Public login page
│       │   ├── admin/                  # Admin dashboard, users, classes, subjects,
│       │   │                             teacher-assignments, read-only assignments view
│       │   ├── teacher/                # Teacher dashboard, create/edit assignment, grade submissions
│       │   └── student/                # Student dashboard, assignment detail, submit/update
│       ├── components/
│       │   ├── ui/                     # Reusable Button, Input, Select, Textarea, Card, Modal, Badge...
│       │   └── layout/                 # AppShell (sidebar/topbar) + RoleGuard (route protection)
│       └── lib/                        # Typed API client, auth context, shared types & utils
├── docker-compose.yml                  # Mongo + backend + frontend, wired together
└── README.md
```

### Why Clean Architecture + Repository pattern

- **Domain** has zero dependencies — pure entities/enums.
- **Application** contains all business logic and rules (who can do what, when) behind interfaces
  (`IXxxRepository`, `IXxxService`), so it can be unit tested without a real database (see the
  in-memory repository fakes under `tests/.../TestDoubles`).
- **Infrastructure** implements those interfaces against MongoDB, JWT, and BCrypt — swappable
  without touching business logic.
- **Api** is a thin layer: controllers translate HTTP requests into Application calls and map
  results back to HTTP responses. Authorization roles are declared with `[Authorize(Roles = ...)]`;
  fine-grained ownership checks (e.g. "only the assignment's own teacher can grade it") live in the
  Application layer so they're covered by unit tests, not just manual API testing.

## Data model

MongoDB is a document database, so relationships below are implemented as ObjectId references
(resolved via application-level lookups) rather than SQL foreign keys:

```
User (Admin | Teacher | Student)
  └─ ClassId → Class                      (Students only)

Class
  └─ (referenced by) Subject.ClassId, Assignment.ClassId, User.ClassId

Subject
  └─ ClassId → Class

TeacherAssignment                          (join collection: who teaches what, where)
  ├─ TeacherId → User (Role = Teacher)
  ├─ SubjectId → Subject
  └─ ClassId   → Class

Assignment
  ├─ ClassId   → Class
  ├─ SubjectId → Subject
  └─ TeacherId → User (Role = Teacher, owner)

Submission
  ├─ AssignmentId → Assignment
  └─ StudentId     → User (Role = Student)
```

Collections: `users`, `classes`, `subjects`, `teacherAssignments`, `assignments`, `submissions`.
A unique index is created on `users.email` at startup.

## Quick start (Docker Compose)

The fastest way to run the entire stack (MongoDB + backend + frontend) with seeded demo data:

```bash
# From the repository root
cp .env.example .env        # optional: override the JWT signing key
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger
- MongoDB: mongodb://localhost:27017 (exposed for inspection with e.g. MongoDB Compass)

On first boot, the backend automatically creates the required MongoDB indexes and seeds demo data
(see [Demo credentials](#demo-credentials)) — no manual table/collection setup needed. To reset the
database and reseed from scratch: `docker compose down -v`.

## Manual setup

If you prefer to run each piece natively instead of Docker:

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm
- MongoDB running locally (or a MongoDB Atlas connection string), e.g.:
  ```bash
  docker run -d --name campusflow-mongo -p 27017:27017 mongo:7
  ```

### 1. Database (MongoDB)

No manual schema setup is required. `backend/src/CampusFlow.Api` creates the `users.email` unique
index and seeds demo data automatically the first time it starts against an empty database
(`CampusFlow.Infrastructure/Seed/DbSeeder.cs`). If you want to start over, drop the `campusflow`
database (or point `MongoDb:DatabaseName` at a new one).

### 2. Backend (ASP.NET Core Web API)

```bash
cd backend
cp .env.example .env   # documents available overrides — appsettings.json already has working defaults
dotnet restore
dotnet run --project src/CampusFlow.Api
```

The API listens on the port printed in the console (typically `http://localhost:5000`, configurable
via `ASPNETCORE_URLS`). Configuration lives in `src/CampusFlow.Api/appsettings.json`; every key can
be overridden with an environment variable using the ASP.NET Core `__` convention — e.g.
`MongoDb__ConnectionString`, `Jwt__Key` (see `backend/.env.example`).

Swagger UI is available at `/swagger` in every environment (including Production), so evaluators
don't need to flip `ASPNETCORE_ENVIRONMENT` to explore the API.

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL if the backend isn't on localhost:5000
npm install
npm run dev
```

Open http://localhost:3000. You'll land on the login page; after signing in you're routed to the
dashboard for your role (`/admin`, `/teacher`, or `/student`).

## Demo credentials

Seeded automatically on first backend startup:

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@campusflow.edu` | `Admin@123` | Full platform access |
| Teacher | `teacher1@campusflow.edu` | `Teacher@123` | Rahim Uddin — teaches Math & Physics, Class 10A |
| Teacher | `teacher2@campusflow.edu` | `Teacher@123` | Fatema Begum — teaches Data Structures & DB Systems, BSc CSE |
| Student | `student1@campusflow.edu` | `Student@123` | Karim Hossain — Class 10A (ungraded submission) |
| Student | `student2@campusflow.edu` | `Student@123` | Nusrat Jahan — Class 10A (graded submission, 85/100) |
| Student | `student3@campusflow.edu` | `Student@123` | Tanvir Ahmed — BSc CSE (graded, late submission, 78/100) |

The login page also has one-click buttons that fill these credentials in for you.

## Running tests

```bash
cd backend
dotnet test
```

This runs the xUnit suite in `tests/CampusFlow.Application.Tests`, covering:

- **Authentication** — valid/invalid credentials, deactivated accounts.
- **Authorization / ownership** — a teacher can't edit or grade another teacher's assignment; a
  student can't view a draft assignment or another student's submission; only an assignment's owning
  teacher can view its submissions.
- **Submission workflow** — on-time vs. late submission status, duplicate-submission prevention,
  submitting to an unpublished/wrong-class assignment, editing after the deadline or after grading,
  editing when resubmission is disabled, marks exceeding an assignment's max marks.

Tests use lightweight in-memory repository fakes (`tests/.../TestDoubles`) instead of a real MongoDB
instance, so they run fast and don't require any external services.

No test currently targets the Api layer directly (controllers are thin pass-throughs to Application
services, which are fully covered); this was a deliberate scope decision given the assignment's time
box — see [Known limitations](#known-limitations).

## API documentation

Full interactive documentation is generated by Swagger/OpenAPI and served at `/swagger` while the
backend is running (e.g. http://localhost:5000/swagger). Highlights:

| Endpoint | Roles | Description |
|---|---|---|
| `POST /api/auth/login` | Public | Authenticate, returns JWT + user profile |
| `GET/POST/PUT/DELETE /api/users` | Admin | Manage user accounts |
| `PATCH /api/users/{id}/reset-password` | Admin | Reset a user's password (no email flow — the new password takes effect immediately) |
| `GET /api/users/me` | Any authenticated | Current user's profile |
| `GET/POST/PUT/DELETE /api/classes` | Read: any; Write: Admin | Manage classes/courses |
| `GET/POST/PUT/DELETE /api/subjects` | Read: any; Write: Admin | Manage subjects (optionally filter by `classId`) |
| `GET/POST/DELETE /api/teacher-assignments` | Admin | Assign a teacher to a subject/class |
| `GET/POST/PUT/DELETE /api/assignments` | Read/write scoped by role | Assignment CRUD (see business rules below) |
| `PATCH /api/assignments/{id}/status` | Teacher (owner) | Publish / revert to draft |
| `POST /api/assignments/{id}/submissions` | Student | Submit an answer |
| `GET /api/assignments/{id}/submissions` | Teacher (owner) / Admin | List submissions for an assignment |
| `GET /api/submissions/my` | Student | Own submissions across all assignments |
| `PUT /api/submissions/{id}` | Student (owner) | Update a submission before the deadline |
| `PATCH /api/submissions/{id}/grade` | Teacher (owner) | Assign marks + feedback |
| `PATCH /api/submissions/{id}/status` | Teacher (owner) | Change submission status |

All endpoints except `/api/auth/login` require a `Bearer` JWT. Errors follow a consistent shape:
`{ "status": 400, "title": "...", "errors": { "FieldName": ["message"] } }`.

## Business rules enforced by the API

These are implemented in the Application layer and covered by unit tests:

- A teacher can only create an assignment for a subject/class they've been assigned to teach
  (enforced against the `TeacherAssignment` collection).
- Only the teacher who owns an assignment can edit it, publish/unpublish it, grade its submissions,
  or change a submission's status. Admins can delete any assignment but do not create or grade them.
- Students only ever see **published** assignments belonging to **their own class**; draft
  assignments and other classes' assignments return 403/are excluded from listings.
- A student can submit an assignment once; submitting again returns a conflict — they must update
  their existing submission instead.
- A submission made after the deadline is still accepted but flagged `Late` (rather than rejected
  outright — a deliberate assumption, see below).
- A submission can only be updated before the deadline, only if the teacher enabled resubmission for
  that assignment, and never after it's been graded.
- Marks entered by a teacher cannot exceed the assignment's configured maximum marks.

## Assumptions

Documented here per the assignment's request to record reasonable assumptions where requirements
weren't fully specified:

1. **No public self-registration.** Admins create Teacher and Student accounts (matches the "Admin:
   Manage users" responsibility). There's no public sign-up flow.
2. **A Subject belongs to exactly one Class/course**, and a Teacher is granted the right to create
   assignments for a subject only via an explicit `TeacherAssignment` (subject+class pair). This
   keeps "who can teach what" explicit and auditable rather than implicit.
3. **Late submissions are accepted, not blocked.** A submission after the deadline is still recorded
   but marked `Late` so a teacher can see and grade it — this seemed more realistic for a school
   context than hard-rejecting them, and gives the submission-status feature something to model.
   *(Reviewed during the Phase 1 audit and deliberately kept as-is — there's no technical reason to
   change it, and hard-rejecting a five-minutes-late submission felt like the wrong default for a
   school tool. If your grading rubric expects a hard block, the one-line change is in
   `SubmissionService.SubmitAsync`.)*
4. **"Update a submission before the deadline, if allowed"** was implemented as a per-assignment
   `AllowResubmission` flag the teacher sets at creation time, checked alongside the deadline and the
   submission not already being graded.
5. **File attachments** are represented as an optional URL field rather than binary file upload/
   storage, since the spec didn't call for file storage infrastructure and this keeps the demo
   self-contained (no S3/blob storage dependency to set up).
6. **Submission status** (`Submitted`, `Late`, `NeedsRevision`, `Graded`) is a fixed enum a teacher
   can move between manually (per "Change the submission status when necessary"), in addition to the
   automatic `Submitted`/`Late` assignment at submission time and `Graded` on grading. `Graded` can
   only be reached through the grade endpoint (it requires marks) — the manual status-change endpoint
   rejects a direct switch to `Graded`, and moving a submission *away* from `Graded` automatically
   clears its marks and feedback, so status and marks can never disagree.
7. **Admin does not directly create/grade assignments** — the spec scopes that to Teachers; Admin's
   assignment-related capability is limited to a read-only view of everything plus the ability to
   delete any assignment (platform moderation).
8. **JWT stored in `localStorage`** on the frontend (not an httpOnly cookie) for simplicity, with
   client-side route guarding per role. Acceptable for a demo/evaluation project; a production
   deployment would likely move to httpOnly cookies + CSRF protection.

## Known limitations

- No integration/controller-level tests (Application-layer unit tests cover the business logic and
  authorization rules; controllers are intentionally thin).
- No refresh-token flow — the JWT simply expires after `Jwt:ExpiryMinutes` (120 min by default) and
  the user is redirected to log in again.
- No file upload/storage — attachments are URL links only (see assumptions above).
- No pagination on list endpoints (`GET /api/users`, `GET /api/assignments`, etc.) — acceptable at
  the demo data scale, called out here as a known gap for a larger dataset.
- No email notifications for new assignments, grading, etc.
- The frontend doesn't have a dedicated "Sign up" flow by design (see assumptions).

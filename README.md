# Team Task Manager

A full-stack team task management web application built for the assignment requirements.

## Tech Stack

- Frontend: React, Vite, lucide-react
- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA
- Database: PostgreSQL
- Auth: JWT bearer tokens

## Features

- Signup and login with secure BCrypt password hashing
- JWT-protected REST APIs
- Create projects; creator automatically becomes project Admin
- Admins can add/remove members and assign Admin or Member roles
- Admins can create and update tasks
- Members can view and update only their assigned tasks
- Task fields: title, description, due date, priority, assignees, status
- Dashboard stats: total tasks, tasks by status, tasks per user, overdue tasks

## Code Structure

### Frontend

- `frontend/src/main.jsx`: React app entry point.
- `frontend/src/App.jsx`: top-level app state, authenticated layout, modal form actions, and page switching.
- `frontend/src/api.js`: shared API client and token helpers.
- `frontend/src/constants.js`: reusable status, priority, and color constants.
- `frontend/src/routes.js`: sidebar route metadata used by the authenticated shell.
- `frontend/src/pages/`: route-level screens:
  - `AuthPage.jsx`: login and signup screen.
  - `DashboardPage.jsx`: summary cards, status chart, team load, and recent tasks.
  - `ProjectsPage.jsx`: project list and selected project summary.
  - `BoardPage.jsx`: kanban board grouped by task status.
  - `TeamPage.jsx`: project members and task counts.
- `frontend/src/components/`: reusable UI pieces:
  - `AppShell.jsx`: sidebar, header, navigation, and admin/member controls.
  - `TaskCard.jsx`, `TaskRow.jsx`: task display variants.
  - `Avatar.jsx`, `NavItem.jsx`, `ui.jsx`: shared small components.
- `frontend/src/utils/taskUtils.js`: task assignee, overdue, initials, and title helpers.
- `frontend/src/styles.css`: global app styles.

### Backend

- `backend/src/main/java/com/ethara/taskmanager/api/`: REST controllers and API error handling.
- `backend/src/main/java/com/ethara/taskmanager/domain/`: JPA entities and enums.
- `backend/src/main/java/com/ethara/taskmanager/repository/`: Spring Data repositories.
- `backend/src/main/java/com/ethara/taskmanager/security/`: JWT, current-user lookup, and Spring Security config.
- `backend/src/main/java/com/ethara/taskmanager/service/`: shared business rules, access checks, and starter workspace setup.
- `backend/src/main/java/com/ethara/taskmanager/config/`: demo data seeding for an empty database.

### Database Tables

Hibernate creates the PostgreSQL schema from the JPA entities:

- `users`: account profile, email, encrypted password, and role.
- `projects`: project name, description, and creator.
- `project_members`: project-to-user membership plus `ADMIN` or `MEMBER` role.
- `tasks`: task title, description, due date, priority, status, and project.
- `task_assignees`: many-to-many task assignment table so one task can be assigned to multiple users and one user can own many tasks.

## Local Setup

### Backend

Create a PostgreSQL database first:

```sql
CREATE DATABASE team_task_manager;
```

Default local connection:

- Database: `team_task_manager`
- Username: `postgres`
- Password: `postgres`
- Port: `5432`

If your PostgreSQL password or database name is different, set environment variables before running.

PowerShell example:

```powershell
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/team_task_manager"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="your_postgres_password"
```

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080` by default. If another app is already using port `8080`, run it on `8081`:

```bash
cd backend
java -jar target/team-task-manager-0.0.1-SNAPSHOT.jar --server.port=8081
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Create one account first, then create a project. To add teammates, those users must sign up first so the Admin can add them by email.

On an empty database, the backend also creates demo data automatically:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskflow.com` | `admin123` |
| Member | `mahi12345@gmail.com` | `Mahi12345` |
| Member | `ravi@taskflow.com` | `password123` |
| Member | `priya@taskflow.com` | `password123` |

The demo admin sees sample projects, team members, dashboard stats, and assigned tasks immediately after login.

If you only want temporary in-memory testing, run the old H2 mode:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

## Environment Variables

### Backend

| Name | Purpose | Local default |
| --- | --- | --- |
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | JDBC database URL | `jdbc:postgresql://localhost:5432/team_task_manager` |
| `DATABASE_USERNAME` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DATABASE_DRIVER` | JDBC driver | `org.postgresql.Driver` |
| `DDL_AUTO` | Hibernate schema mode | `update` |
| `JWT_SECRET` | JWT signing secret | development fallback |
| `JWT_EXPIRATION_MINUTES` | Token lifetime | `1440` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:5173,http://localhost:3000` |

### Frontend

| Name | Purpose | Local default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api` |

## Railway Deployment

Deploy as two Railway services:

1. Backend service from `backend/`
   - Add a Railway PostgreSQL database.
   - Set:
     - `DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>`
     - `DATABASE_USERNAME=<postgres user>`
     - `DATABASE_PASSWORD=<postgres password>`
     - `DATABASE_DRIVER=org.postgresql.Driver`
     - `JWT_SECRET=<long random secret>`
     - `CORS_ALLOWED_ORIGINS=<frontend public URL>`
2. Frontend service from `frontend/`
   - Set `VITE_API_URL=<backend public URL>/api`.
   - Railway will run the Vite build and serve the static app.

## Main API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{projectId}/members`
- `POST /api/projects/{projectId}/members`
- `DELETE /api/projects/{projectId}/members/{userId}`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}/status`
- `GET /api/dashboard`

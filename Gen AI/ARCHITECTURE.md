# Employee Management Architecture

## Stack

- Next.js App Router with TypeScript for the frontend and server-side API route handlers.
- SQLite for persistence, accessed with `better-sqlite3` and explicit SQL statements. Prisma and other ORMs are not used.
- React client components for interactive list, form, and detail workflows; CSS Modules are not required, and the app uses shared global styles.
- ESLint and TypeScript for static checks. No test framework existed when the project was created.

## Structure and Responsibilities

- **Frontend:** `src/app/page.tsx` and `src/components/dashboard.tsx` provide the employee directory and search/filter states. `src/app/employees/` contains create, detail, and edit pages; `src/components/employee-form.tsx` owns form interaction only.
- **API layer:** `src/app/api/employees/route.ts` handles list/search/create; `src/app/api/employees/[id]/route.ts` handles read/update/delete. Route handlers validate payloads, map errors to HTTP responses, and delegate to the service.
- **Business/service layer:** `src/lib/employee-service.ts` applies validated operations and translates persistence conflicts.
- **Repository/database layer:** `src/lib/employee-repository.ts` contains parameterized SQL. `src/lib/db.ts` owns the SQLite connection and table initialization. The database file is stored at `data/employees.db` by default; `EMPLOYEE_DB_PATH` can override it.
- **Shared contracts and validation:** `src/lib/employee-types.ts` defines the API/data shape; `src/lib/employee-validation.ts` validates input in the form and API boundary.

## Data and Flows

Employee fields: `id`, `name`, `email`, `phone`, `position`, `department`, `status`, `createdAt`, and `updatedAt`. SQLite owns IDs and timestamps. Status values are `active`, `on-leave`, and `inactive`.

List/search calls `GET /api/employees?search=...`; detail calls `GET /api/employees/:id`. Create and edit validate before submission, call `POST /api/employees` or `PUT /api/employees/:id`, then show success and link to the saved record. Delete requires explicit confirmation and calls `DELETE /api/employees/:id`; failures leave the record visible and report the error.

## Validation and Errors

Validate required employee fields, field lengths, status, optional phone format, and email format with `src/lib/employee-validation.ts` both in the form and API. SQLite enforces required fields, allowed status values, and case-insensitive unique email. Convert API/persistence failures into understandable UI errors; never expose secrets or internal traces to users.
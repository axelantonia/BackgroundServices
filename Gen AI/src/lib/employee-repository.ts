import "server-only";
import { db } from "@/lib/db";
import type { Employee, EmployeeInput } from "@/lib/employee-types";

export function listEmployees(search = ""): Employee[] {
  const term = `%${search.trim()}%`;
  return db
    .prepare(
      `SELECT id, name, email, phone, position, department, status, createdAt, updatedAt
       FROM employees
       WHERE @search = '' OR name LIKE @term OR email LIKE @term
         OR position LIKE @term OR department LIKE @term
       ORDER BY name COLLATE NOCASE ASC`,
    )
    .all({ search: search.trim(), term }) as Employee[];
}

export function findEmployee(id: number): Employee | undefined {
  return db
    .prepare(
      `SELECT id, name, email, phone, position, department, status, createdAt, updatedAt
       FROM employees WHERE id = ?`,
    )
    .get(id) as Employee | undefined;
}

export function insertEmployee(input: EmployeeInput): Employee {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO employees (name, email, phone, position, department, status, createdAt, updatedAt)
       VALUES (@name, @email, @phone, @position, @department, @status, @createdAt, @updatedAt)`,
    )
    .run({ ...input, createdAt: now, updatedAt: now });

  return findEmployee(Number(result.lastInsertRowid))!;
}

export function updateEmployee(id: number, input: EmployeeInput): Employee | undefined {
  const result = db
    .prepare(
      `UPDATE employees
       SET name = @name, email = @email, phone = @phone, position = @position,
           department = @department, status = @status, updatedAt = @updatedAt
       WHERE id = @id`,
    )
    .run({ ...input, updatedAt: new Date().toISOString(), id });

  return result.changes > 0 ? findEmployee(id) : undefined;
}

export function removeEmployee(id: number): boolean {
  return db.prepare("DELETE FROM employees WHERE id = ?").run(id).changes > 0;
}
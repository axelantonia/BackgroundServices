import "server-only";
import {
  findEmployee,
  insertEmployee,
  listEmployees,
  removeEmployee,
  updateEmployee,
} from "@/lib/employee-repository";
import type { Employee, EmployeeInput } from "@/lib/employee-types";

export class EmployeeConflictError extends Error {
  constructor() {
    super("An employee with this email address already exists.");
    this.name = "EmployeeConflictError";
  }
}

function withConflictHandling<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "SQLITE_CONSTRAINT_PRIMARYKEY")
    ) {
      throw new EmployeeConflictError();
    }
    throw error;
  }
}

export const employeeService = {
  list(search?: string) {
    return listEmployees(search);
  },
  get(id: number) {
    return findEmployee(id);
  },
  create(input: EmployeeInput) {
    return withConflictHandling<Employee>(() => insertEmployee(input));
  },
  update(id: number, input: EmployeeInput) {
    return withConflictHandling(() => updateEmployee(id, input));
  },
  delete(id: number) {
    return removeEmployee(id);
  },
};
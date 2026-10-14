import { EMPLOYEE_STATUSES, type EmployeeInput } from "@/lib/employee-types";

export type ValidationResult =
  | { success: true; data: EmployeeInput }
  | { success: false; fieldErrors: Record<string, string> };

export function validateEmployeeInput(input: unknown): ValidationResult {
  const values =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const fieldErrors: Record<string, string> = {};
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const phone = typeof values.phone === "string" ? values.phone.trim() : "";
  const position = typeof values.position === "string" ? values.position.trim() : "";
  const department = typeof values.department === "string" ? values.department.trim() : "";
  const status = typeof values.status === "string" ? values.status : "";

  if (name.length < 2 || name.length > 80) fieldErrors.name = "Name must be 2 to 80 characters.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (phone.length > 24 || (phone && !/^[+()\d.\-\s]+$/.test(phone))) {
    fieldErrors.phone = "Enter a valid phone number or leave it blank.";
  }
  if (!position || position.length > 100) fieldErrors.position = "Position is required (100 characters max).";
  if (!department || department.length > 100) fieldErrors.department = "Department is required (100 characters max).";
  if (!EMPLOYEE_STATUSES.includes(status as EmployeeInput["status"])) {
    fieldErrors.status = "Choose a valid employment status.";
  }

  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      position,
      department,
      status: status as EmployeeInput["status"],
    },
  };
}
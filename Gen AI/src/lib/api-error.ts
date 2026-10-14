import { NextResponse } from "next/server";
import { EmployeeConflictError } from "@/lib/employee-service";

export function apiErrorResponse(error: unknown) {
  if (error instanceof EmployeeConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error("Employee API operation failed.");
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
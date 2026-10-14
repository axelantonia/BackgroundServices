import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { employeeService } from "@/lib/employee-service";
import { validateEmployeeInput } from "@/lib/employee-validation";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") ?? "";
    return NextResponse.json({ employees: employeeService.list(search) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateEmployeeInput(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: validation.fieldErrors },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({ employee: employeeService.create(validation.data) }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { employeeService } from "@/lib/employee-service";
import { validateEmployeeInput } from "@/lib/employee-validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  try {
    const employee = employeeService.get(id);
    return employee
      ? NextResponse.json({ employee })
      : NextResponse.json({ error: "Employee not found." }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

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
    const employee = employeeService.update(id, validation.data);
    return employee
      ? NextResponse.json({ employee })
      : NextResponse.json({ error: "Employee not found." }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  try {
    return employeeService.delete(id)
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Employee not found." }, { status: 404 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
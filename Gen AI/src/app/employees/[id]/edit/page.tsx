import EmployeeForm from "@/components/employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeForm mode="edit" employeeId={id} />;
}
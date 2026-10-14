import type { EmployeeStatus } from "@/lib/employee-types";

const statusLabels: Record<EmployeeStatus, string> = {
  active: "Active",
  "on-leave": "On leave",
  inactive: "Inactive",
};

export default function StatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>;
}
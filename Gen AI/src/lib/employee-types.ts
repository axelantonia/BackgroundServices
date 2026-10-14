export const EMPLOYEE_STATUSES = ["active", "on-leave", "inactive"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export type EmployeeInput = {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: EmployeeStatus;
};

export type Employee = EmployeeInput & {
  id: number;
  createdAt: string;
  updatedAt: string;
};
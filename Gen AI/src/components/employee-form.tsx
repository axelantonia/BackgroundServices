"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Employee, EmployeeInput } from "@/lib/employee-types";
import { validateEmployeeInput } from "@/lib/employee-validation";

const emptyValues: EmployeeInput = { name: "", email: "", phone: "", position: "", department: "", status: "active" };

export default function EmployeeForm({ mode, employeeId }: { mode: "create" | "edit"; employeeId?: string }) {
  const [values, setValues] = useState<EmployeeInput>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [savedEmployee, setSavedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !employeeId) return;
    const controller = new AbortController();
    fetch(`/api/employees/${employeeId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employee.");
        const employee = data.employee as Employee;
        setValues({ name: employee.name, email: employee.email, phone: employee.phone, position: employee.position, department: employee.department, status: employee.status });
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [mode, employeeId]);

  function setField(field: keyof EmployeeInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setSavedEmployee(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSavedEmployee(null);
    const validation = validateEmployeeInput(values);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const response = await fetch(mode === "create" ? "/api/employees" : `/api/employees/${employeeId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const data = await response.json();
      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        throw new Error(data.error || "Unable to save employee.");
      }
      setValues({ name: data.employee.name, email: data.employee.email, phone: data.employee.phone, position: data.employee.position, department: data.employee.department, status: data.employee.status });
      setSavedEmployee(data.employee as Employee);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="workspace workspace-narrow">
      <header className="page-topline"><Link className="back-link" href="/"><ArrowLeft size={16} /> Directory</Link></header>
      <section className="form-heading"><p className="eyebrow">PEOPLE OPERATIONS</p><h1>{mode === "create" ? "Add employee" : "Edit employee"}</h1><p>{mode === "create" ? "Employee details" : "Update employee details"}</p></section>
      {loading ? <div className="detail-panel loading-panel"><span className="loading-dot" /> Loading employee...</div> : (
        <form className="employee-form detail-panel" onSubmit={submit} noValidate>
          {error && <div className="error-banner" role="alert">{error}</div>}
          {savedEmployee && <div className="success-banner" role="status"><Check size={16} /> Changes saved. <Link href={`/employees/${savedEmployee.id}`}>View employee</Link></div>}
          <div className="form-section-title"><h2>Personal information</h2><span>Fields marked * are required</span></div>
          <div className="form-grid">
            <Field label="Full name" name="name" value={values.name} error={fieldErrors.name} required onChange={(value) => setField("name", value)} autoComplete="name" />
            <Field label="Work email" name="email" type="email" value={values.email} error={fieldErrors.email} required onChange={(value) => setField("email", value)} autoComplete="email" />
            <Field label="Phone" name="phone" type="tel" value={values.phone} error={fieldErrors.phone} onChange={(value) => setField("phone", value)} autoComplete="tel" />
            <Field label="Position" name="position" value={values.position} error={fieldErrors.position} required onChange={(value) => setField("position", value)} />
            <Field label="Department" name="department" value={values.department} error={fieldErrors.department} required onChange={(value) => setField("department", value)} />
            <label className="field-label">Status <span className="required-mark">*</span><span className="select-wrap"><select value={values.status} onChange={(event) => setField("status", event.target.value)} aria-invalid={Boolean(fieldErrors.status)}><option value="active">Active</option><option value="on-leave">On leave</option><option value="inactive">Inactive</option></select><ChevronDown size={15} /></span>{fieldErrors.status && <span className="field-error">{fieldErrors.status}</span>}</label>
          </div>
          <div className="form-actions"><Link className="button button-secondary" href="/">Cancel</Link><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create employee" : "Save changes"}</button></div>
        </form>
      )}
    </main>
  );
}

function Field({ label, name, value, error, required = false, type = "text", autoComplete, onChange }: { label: string; name: string; value: string; error?: string; required?: boolean; type?: string; autoComplete?: string; onChange: (value: string) => void }) {
  return <label className="field-label">{label} {required && <span className="required-mark">*</span>}<input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={name === "name" ? 80 : name === "email" ? 254 : name === "phone" ? 24 : 100} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />{error && <span id={`${name}-error`} className="field-error">{error}</span>}</label>;
}
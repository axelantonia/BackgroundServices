"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, BriefcaseBusiness, Building2, Check, ChevronRight, CircleHelp, Search, UserPlus, Users, X } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import type { Employee, EmployeeStatus } from "@/lib/employee-types";

type StatusFilter = "all" | EmployeeStatus;
const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All employees" },
  { id: "active", label: "Active" },
  { id: "on-leave", label: "On leave" },
  { id: "inactive", label: "Inactive" },
];

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [finishedRequestKey, setFinishedRequestKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const requestKey = `${search}:${refreshKey}`;
  const loading = finishedRequestKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/employees?search=${encodeURIComponent(search)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employees.");
        setEmployees(data.employees as Employee[]);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFinishedRequestKey(requestKey);
      })
      ;
    return () => controller.abort();
  }, [search, refreshKey, requestKey]);

  const visibleEmployees = useMemo(
    () => statusFilter === "all" ? employees : employees.filter((employee) => employee.status === statusFilter),
    [employees, statusFilter],
  );
  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const departmentCount = new Set(employees.map((employee) => employee.department.toLowerCase())).size;

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/employees/${pendingDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete employee.");
      setEmployees((current) => current.filter((employee) => employee.id !== pendingDelete.id));
      setNotice(`${pendingDelete.name} was removed.`);
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete employee.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="People Desk home">
          <span className="brand-mark"><Users size={19} strokeWidth={2.3} /></span>
          <span>people<span className="brand-light">desk</span></span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <Link href="/" className="nav-item nav-item-active"><Users size={17} /> Employees <span className="nav-count">{employees.length}</span></Link>
        <div className="sidebar-section-label sidebar-bottom-label">ORGANIZATION</div>
        <div className="sidebar-note"><Building2 size={16} /><span>People operations</span></div>
        <div className="sidebar-footer"><CircleHelp size={15} /> Employee directory</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>Employees</strong></div>
          <div className="topbar-user"><span className="topbar-dot" /> Admin workspace</div>
        </header>

        <div className="content-area">
          <section className="page-heading">
            <div>
              <p className="eyebrow">PEOPLE OPERATIONS</p>
              <h1>Employees</h1>
              <p className="page-subtitle">A clear view of your people and teams.</p>
            </div>
            <Link href="/employees/new" className="button button-primary"><UserPlus size={16} /> Add employee</Link>
          </section>

          <section className="overview-strip" aria-label="Employee summary">
            <Summary icon={<Users size={17} />} label="Directory" value={String(employees.length)} detail="matching records" tone="green" />
            <Summary icon={<Check size={17} />} label="Active" value={String(activeCount)} detail="currently active" tone="lime" />
            <Summary icon={<Building2 size={17} />} label="Departments" value={String(departmentCount)} detail="represented" tone="orange" />
          </section>

          <section className="directory-section">
            <div className="directory-heading">
              <div><h2>Directory</h2><span>{visibleEmployees.length} {visibleEmployees.length === 1 ? "person" : "people"}</span></div>
              <label className="search-box">
                <Search size={16} aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" aria-label="Search employees" />
                {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
              </label>
            </div>

            <div className="filter-row" role="tablist" aria-label="Filter employees by status">
              {filters.map((filter) => (
                <button key={filter.id} type="button" role="tab" aria-selected={statusFilter === filter.id} className={`filter-tab${statusFilter === filter.id ? " filter-tab-active" : ""}`} onClick={() => setStatusFilter(filter.id)}>
                  {filter.label}
                </button>
              ))}
              <span className="sort-label"><ArrowDownUp size={14} /> Name A–Z</span>
            </div>

            {notice && <div className="success-banner" role="status"><Check size={16} /> {notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button></div>}
            {error && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button></div>}

            <div className="table-wrap">
              <table className="employee-table">
                <thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>POSITION</th><th>STATUS</th><th>UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }, (_, index) => <tr className="skeleton-row" key={index}><td colSpan={6}><span /></td></tr>)
                  ) : visibleEmployees.length > 0 ? visibleEmployees.map((employee, index) => (
                    <tr key={employee.id}>
                      <td><Link className="employee-link" href={`/employees/${employee.id}`}><span className={`employee-avatar avatar-${index % 5}`}>{employee.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="employee-name-block"><strong>{employee.name}</strong><small>{employee.email}</small></span></Link></td>
                      <td><span className="department-cell"><BriefcaseBusiness size={14} />{employee.department}</span></td>
                      <td className="position-cell">{employee.position}</td>
                      <td><StatusBadge status={employee.status} /></td>
                      <td className="date-cell">{new Date(employee.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td><button className="icon-button delete-trigger" type="button" onClick={() => { setPendingDelete(employee); setNotice(""); }} aria-label={`Delete ${employee.name}`} title="Delete employee"><X size={16} /></button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6}><div className="empty-state"><span className="empty-icon"><Users size={23} /></span><h3>{employees.length === 0 ? "No employees yet" : "No matching employees"}</h3><p>{employees.length === 0 ? "Add your first employee to start the directory." : "Try another search or status filter."}</p>{employees.length === 0 ? <Link className="button button-secondary" href="/employees/new"><UserPlus size={15} /> Add employee</Link> : <button className="text-button" type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</button>}</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>{loading ? "Loading directory" : `Showing ${visibleEmployees.length} of ${employees.length} matching records`}</span><span>Updated in real time</span></footer>
          </section>
        </div>
      </main>

      {pendingDelete && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className="dialog-icon"><X size={19} /></span><h2 id="delete-title">Remove employee?</h2><p><strong>{pendingDelete.name}</strong> will be permanently removed from the directory.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</button><button className="button button-danger" type="button" onClick={confirmDelete} disabled={deleting}>{deleting ? "Removing..." : "Remove employee"}</button></div></section></div>}
    </div>
  );
}

function Summary({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <div className="summary-item"><span className={`summary-icon summary-${tone}`}>{icon}</span><div><span className="summary-label">{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}
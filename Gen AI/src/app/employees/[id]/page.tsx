"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Mail, Pencil, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/status-badge";
import type { Employee } from "@/lib/employee-types";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void params.then(({ id }) =>
      fetch(`/api/employees/${id}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Unable to load employee.");
          setEmployee(data.employee as Employee);
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof Error && requestError.name !== "AbortError") {
            setError(requestError.message);
          }
        })
        .finally(() => setLoading(false)),
    );
    return () => controller.abort();
  }, [params]);

  return (
    <main className="workspace workspace-narrow">
      <header className="page-topline">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Directory
        </Link>
        {employee && (
          <Link className="button button-primary" href={`/employees/${employee.id}/edit`}>
            <Pencil size={15} /> Edit employee
          </Link>
        )}
      </header>

      {loading ? (
        <section className="detail-panel loading-panel" aria-label="Loading employee">
          <span className="loading-dot" /> Loading employee...
        </section>
      ) : error ? (
        <section className="detail-panel error-panel" role="alert">
          <p>{error}</p>
          <Link className="text-link" href="/">Return to directory</Link>
        </section>
      ) : employee ? (
        <>
          <div className="detail-heading">
            <div className="detail-avatar">{employee.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div>
              <p className="eyebrow">EMPLOYEE PROFILE</p>
              <h1>{employee.name}</h1>
              <p className="detail-role">{employee.position}</p>
            </div>
            <StatusBadge status={employee.status} />
          </div>

          <section className="detail-panel">
            <h2>Contact &amp; role</h2>
            <div className="detail-grid">
              <DetailItem icon={<Mail size={17} />} label="Email" value={employee.email} />
              <DetailItem icon={<Phone size={17} />} label="Phone" value={employee.phone || "Not provided"} />
              <DetailItem icon={<BriefcaseBusiness size={17} />} label="Department" value={employee.department} />
              <DetailItem icon={<Users size={17} />} label="Position" value={employee.position} />
              <DetailItem icon={<CalendarDays size={17} />} label="Added" value={new Date(employee.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} />
              <DetailItem icon={<CalendarDays size={17} />} label="Last updated" value={new Date(employee.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })} />
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-item">
      <span className="detail-item-icon">{icon}</span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </div>
  );
}
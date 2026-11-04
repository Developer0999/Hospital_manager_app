import React, { useState } from "react";
import { getCustomersByHospital } from "../../api";
import { PageTitle, Card, Table, StatusBadge, inputStyle, btnPrimary } from "../../components/UI";

export default function PatientSearch({ session }) {
  const [q,       setQ]       = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await getCustomersByHospital(session.hospitalId);
      const all = res.data;
      const found = all.filter((p) =>
        (p.custName    || "").toLowerCase().includes(q.toLowerCase()) ||
        (p.custContact || "").includes(q) ||
        String(p.custId).includes(q) ||
        (p.custEmail   || "").toLowerCase().includes(q.toLowerCase())
      );
      setResults(found);
      setSearched(true);
    } catch (e) {
      alert("Search failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") search(); };

  return (
    <div>
      <PageTitle icon="🔍" title="Patient Search" subtitle="Find a patient by name, mobile, email or ID" />

      <Card style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Name / Mobile / Email / Patient ID"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button style={btnPrimary} onClick={search} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
        </div>
      </Card>

      {searched && (
        <Card>
          <h3 style={{ marginBottom: "16px" }}>
            {results.length > 0
              ? `Found ${results.length} patient(s) for "${q}"`
              : `No patients found for "${q}"`}
          </h3>
          <Table
            columns={["ID", "Name", "Contact", "Email", "Age", "Gender", "Disease", "Status"]}
            rows={results.map((p) => [
              p.custId,
              p.custName,
              p.custContact,
              p.custEmail   || "—",
              p.age         || "—",
              p.gender      || "—",
              p.disease     || "—",
              <StatusBadge status={p.active ? "Active" : "Inactive"} />,
            ])}
            emptyText="No patients found."
          />
        </Card>
      )}
    </div>
  );
}

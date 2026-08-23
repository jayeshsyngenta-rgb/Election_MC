
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  LogOut,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Copy,
  XCircle,
} from "lucide-react";
import Header from "../components/Header";
import SearchFilters from "../components/SearchFilters";
import { api } from "../api";

function StatusTable({ title, rows, labelHeader }) {
  return (
    <>
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>{labelHeader}</th>
              <th>Total</th>
              <th>Done</th>
              <th>Not Done</th>
              <th>Pralambit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No matching data
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const counts = { done: 0, not_done: 0, pending: 0 };
                row.statuses.forEach((s) => {
                  counts[s.status] = s.count;
                });
                return (
                  <tr key={row._id}>
                    <td>{row._id}</td>
                    <td>{row.total}</td>
                    <td>{counts.done}</td>
                    <td>{counts.not_done}</td>
                    <td>{counts.pending}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ROW_CLASS = {
  done: "row-done",
  not_done: "row-not-done",
  pending: "row-pending",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportFilters, setExportFilters] = useState({});
  const [exporting, setExporting] = useState(false);

  const [voters, setVoters] = useState([]);
  const [votersLoading, setVotersLoading] = useState(false);
  const [votersError, setVotersError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Alphabetical sort by Voter Name: null (unsorted / API order) -> "asc" -> "desc" -> null
  const [sortOrder, setSortOrder] = useState(null);

  // { label: "Institute Name" | "Voter Name", value: string } | null
  const [expandedCell, setExpandedCell] = useState(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      if (err.unauthorized) {
        navigate("/admin/login");
        return;
      }
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   loadStats();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const cleanFilters = useMemo(
    () => Object.fromEntries(Object.entries(exportFilters).filter(([, v]) => v)),
    [exportFilters],
  );

  const hasActiveFilter = Object.keys(cleanFilters).length > 0;

  // Load the individual voter records whenever the filters change -
  // only once at least one filter is set, so a blank search doesn't
  // try to pull down the entire dataset.
  useEffect(() => {
    if (!hasActiveFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoters([]);
      setVotersError("");
      return;
    }
    const controller = new AbortController();
    setVotersLoading(true);
    setVotersError("");
    api
      .searchVoters(cleanFilters, controller.signal)
      .then((data) => {
        // Handles either a plain array response or a paginated
        // { voters, total } shape.
        setVoters(Array.isArray(data) ? data : data.voters || []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (err.unauthorized) {
          navigate("/admin/login");
          return;
        }
        setVotersError(err.message || "Failed to load records");
      })
      .finally(() => setVotersLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanFilters]);

  // Reset sort whenever a new filter search runs, so stale sort state
  // doesn't carry over confusingly between different record sets.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSortOrder(null);
  }, [cleanFilters]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    navigate("/admin/login");
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === "excel") {
        await api.exportExcel(cleanFilters);
      } else {
        await api.exportPdf(cleanFilters);
      }
    } catch (err) {
      if (err.unauthorized) {
        navigate("/admin/login");
        return;
      }
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (voterId, newStatus) => {
    const previous = voters;
    setUpdatingId(voterId);
    // Optimistic update so the buttons feel instant.
    setVoters((prev) =>
      prev.map((v) => (v._id === voterId ? { ...v, status: newStatus } : v)),
    );
    try {
      await api.updateVoterStatus(voterId, newStatus);
      // Refresh the aggregate counts/tables so they stay in sync with
      // the record that was just changed.
      loadStats();
    } catch (err) {
      // Roll back on failure.
      setVoters(previous);
      if (err.unauthorized) {
        navigate("/admin/login");
        return;
      }
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Narrow the stats tables live based on whatever filters are
  // currently selected. Any single field (district only, taluka
  // only, etc.) works on its own - nothing requires the others.
  const filteredByDistrict = useMemo(() => {
    if (!stats?.byDistrict) return [];
    if (!exportFilters.district) return stats.byDistrict;
    return stats.byDistrict.filter((row) => row._id === exportFilters.district);
  }, [stats, exportFilters.district]);

  const filteredByTaluka = useMemo(() => {
    if (!stats?.byTaluka) return [];
    if (!exportFilters.taluka) return stats.byTaluka;
    return stats.byTaluka.filter((row) => row._id === exportFilters.taluka);
  }, [stats, exportFilters.taluka]);

  // Voter records sorted alphabetically by name (ascending/descending),
  // or left in whatever order the API returned them in when unsorted.
  const sortedVoters = useMemo(() => {
    if (!sortOrder) return voters;
    const sorted = [...voters].sort((a, b) =>
      (a.electorName || "").localeCompare(b.electorName || "", undefined, {
        sensitivity: "base",
      }),
    );
    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [voters, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
    );
  };

  const SortIcon =
    sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;

  const openExpanded = (label, value) => {
    if (!value) return;
    setCopied(false);
    setExpandedCell({ label, value });
  };

  const closeExpanded = () => {
    setExpandedCell(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!expandedCell) return;
    try {
      await navigator.clipboard.writeText(expandedCell.value);
      setCopied(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <p>Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <div className="results-header">
          <h2 className="section-title">
            <BarChart3 size={20} />
            ADMIN DASHBOARD
          </h2>
          <button className="btn btn-primary" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <SearchFilters onSearch={setExportFilters} />

        <section className="card">
          {error && <p style={{ color: "#dc3545" }}>{error}</p>}

          {stats && (
            <>
              <div className="filters-grid stats-grid" style={{ marginBottom: 20 }}>
                <div className="field">
                  <label>Total Voters</label>
                  <strong style={{ fontSize: 24, color: "#0b3d91" }}>
                    {stats.totalVoters}
                  </strong>
                </div>
                <div className="field">
                  <label>Done</label>
                  <strong style={{ fontSize: 24, color: "#1e7e34" }}>
                    {stats.overall.done}
                  </strong>
                </div>
                <div className="field">
                  <label>Not Done</label>
                  <strong style={{ fontSize: 24, color: "#a71d2a" }}>
                    {stats.overall.not_done}
                  </strong>
                </div>
                <div className="field">
                  <label>Pralambit (Pending)</label>
                  <strong style={{ fontSize: 24, color: "#1d4ed8" }}>
                    {stats.overall.pending}
                  </strong>
                </div>
              </div>

              {stats.byDistrict && (
                <StatusTable
                  title="Progress by District"
                  rows={filteredByDistrict}
                  labelHeader="District"
                />
              )}

              <StatusTable
                title="Progress by Taluka"
                rows={filteredByTaluka}
                labelHeader="Taluka"
              />
            </>
          )}
        </section>

        <section className="card">
          <div className="results-header">
            <h2 className="section-title">VOTER RECORDS</h2>
            {hasActiveFilter && !votersLoading && !votersError && (
              <span className="total-records-badge">
                Total: <strong>{voters.length}</strong>
              </span>
            )}
          </div>

          {!hasActiveFilter && (
            <p style={{ opacity: 0.75 }}>
              Pick a district, taluka, village, or institute above to load
              individual records here.
            </p>
          )}

          {hasActiveFilter && votersLoading && <p>Loading records...</p>}

          {votersError && <p style={{ color: "#dc3545" }}>{votersError}</p>}

          {hasActiveFilter && !votersLoading && !votersError && (
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th className="col-id">Sr No</th>
                    <th
                      className="col-name"
                      onClick={toggleSort}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Click to sort alphabetically"
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Name
                        <SortIcon size={14} style={{ opacity: sortOrder ? 1 : 0.4 }} />
                      </span>
                    </th>
                    <th className="col-mobile">Mobile</th>
                    <th className="col-district">District</th>
                    <th className="col-narrow">Taluka</th>
                    <th className="col-narrow">Village</th>
                    <th className="col-institute">Institute</th>
                    <th className="col-id">Part</th>
                    <th className="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVoters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-row">
                        No matching records
                      </td>
                    </tr>
                  ) : (
                    sortedVoters.map((v) => (
                      <tr key={v._id} className={ROW_CLASS[v.status] || ""}>
                        <td className="col-id">{v.srNo}</td>
                        <td
                          className="voter-name col-name col-name-nowrap clickable-cell"
                          onClick={() => openExpanded("Voter Name", v.electorName)}
                        >
                          {v.electorName}
                        </td>
                        <td className="col-mobile">{v.mobileNo ?? "-"}</td>
                        <td className="col-district">{v.district}</td>
                        <td className="col-narrow">{v.taluka}</td>
                        <td className="col-narrow">{v.village}</td>
                        <td
                          className="institute-link col-institute clickable-cell"
                          onClick={() => openExpanded("Institute Name", v.institute)}
                        >
                          {v.institute}
                        </td>
                        <td className="col-id">{v.part}</td>
                        <td className="col-status">
                          <div className="status-buttons">
                            <button
                              type="button"
                              className={`status-btn status-btn-done ${
                                v.status === "done" ? "active" : ""
                              }`}
                              disabled={updatingId === v._id}
                              onClick={() => handleStatusChange(v._id, "done")}
                              title="Done"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              className={`status-btn status-btn-not-done ${
                                v.status === "not_done" ? "active" : ""
                              }`}
                              disabled={updatingId === v._id}
                              onClick={() =>
                                handleStatusChange(v._id, "not_done")
                              }
                              title="Not Done"
                            >
                              <X size={16} />
                            </button>
                            <button
                              type="button"
                              className={`status-btn status-btn-pending ${
                                v.status === "pending" ? "active" : ""
                              }`}
                              disabled={updatingId === v._id}
                              onClick={() =>
                                handleStatusChange(v._id, "pending")
                              }
                              title="Pralambit"
                            >
                              <Clock size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">EXPORT REPORT</h2>
          <p>Uses the filters above (leave blank for the full dataset).</p>
          <div className="filters-actions">
            <button
              className="btn btn-success"
              onClick={() => handleExport("excel")}
              disabled={exporting}
            >
              <FileSpreadsheet size={18} />
              Excel Export
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleExport("pdf")}
              disabled={exporting}
            >
              <FileText size={18} />
              PDF Export
            </button>
          </div>
        </section>
      </main>

      {expandedCell && (
        <div className="cell-modal-overlay" onClick={closeExpanded}>
          <div className="cell-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cell-modal-header">
              <span>{expandedCell.label}</span>
              <button className="cell-modal-close" onClick={closeExpanded} title="Close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="cell-modal-body">{expandedCell.value}</div>
            <div className="cell-modal-footer">
              <button className="btn btn-outline" onClick={handleCopy}>
                <Copy size={16} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
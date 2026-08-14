import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Printer,
  FileSpreadsheet,
  FileText,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Copy,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api";
import { getImageBase64 } from "../utils/imageToBase64";
import chiefPhoto from "../assets/cm.jpg";
import { loadDevanagariFonts } from "../utils/notoSansDevanagariFont";

const STATUS_META = {
  done: { label: "Done", rowClass: "row-done" },
  not_done: { label: "Not Done", rowClass: "row-not-done" },
  pending: { label: "Pralambit", rowClass: "row-pending" },
};

// Voter names sometimes carry a trailing "[Shifted from ...]" note in the
// source data - strip it so only the first/middle/last name shows.
function cleanVoterName(name) {
  if (!name) return name;
  return name.replace(/\s*\[.*?\]\s*$/, "").trim();
}

// Shared header text used on the printed page, PDF export, and Excel
// export, so all three match the on-screen header.
const ORG_HEADER_LINE1 =
  "श्री मंगेश चिवटे (कक्ष प्रमुख, उपमुख्यमंत्री वैद्यकीय कक्ष) तथा औषधी उपमुख्यमंत्री";
const ORG_HEADER_LINE2 = "Voter Search Portal";

const EXPORT_COLUMNS = [
  { header: "Part No", key: "part" },
  { header: "Sr. No", key: "srNo" },
  { header: "Voter Name", key: "electorName" },
  { header: "Mobile No.", key: "mobileNo" },
  { header: "Address", key: "address" },
  { header: "Institute Name", key: "institute" },
  { header: "Village", key: "village" },
  { header: "Taluka", key: "taluka" },
];

// jsPDF's built-in fonts (Helvetica etc.) don't include Devanagari
// glyphs, which is why the Marathi header used to come out as garbled
// boxes/symbols in the exported PDF. This fetches a Devanagari + Latin
// font (Noto Sans Devanagari) and registers it with the document so
// both scripts render correctly. Safe to call every export - addFont
// just re-registers the same font name, and loadDevanagariFonts()
// caches the fetch after the first call.
async function registerDevanagariFont(doc) {
  const fonts = await loadDevanagariFonts();
  doc.addFileToVFS("NotoSansDevanagari-Regular.ttf", fonts.regular);
  doc.addFont(
    "NotoSansDevanagari-Regular.ttf",
    "NotoSansDevanagari",
    "normal",
  );
  doc.addFileToVFS("NotoSansDevanagari-Bold.ttf", fonts.bold);
  doc.addFont("NotoSansDevanagari-Bold.ttf", "NotoSansDevanagari", "bold");
}

export default function SearchResults({
  voters,
  filters,
  loading,
  onStatusChange,
}) {
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [sortOrder, setSortOrder] = useState(null); // null | "asc" | "desc"
  const [exportingPdf, setExportingPdf] = useState(false);

  // { label: "Address" | "Institute Name", value: string } | null
  const [expandedCell, setExpandedCell] = useState(null);
  const [copied, setCopied] = useState(false);

  // Client-side name filter over whatever the API already returned.
  const filteredVoters = useMemo(() => {
    if (!query.trim()) return voters;
    const q = query.trim().toLowerCase();
    return voters.filter((v) =>
      cleanVoterName(v.electorName).toLowerCase().includes(q),
    );
  }, [voters, query]);

  // Alphabetical sort by Voter Name, applied on top of the name filter.
  const displayedVoters = useMemo(() => {
    if (!sortOrder) return filteredVoters;
    const sorted = [...filteredVoters].sort((a, b) =>
      cleanVoterName(a.electorName).localeCompare(cleanVoterName(b.electorName), undefined, {
        sensitivity: "base",
      }),
    );
    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [filteredVoters, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) =>
      prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
    );
  };

  const SortIcon =
    sortOrder === "asc"
      ? ArrowUp
      : sortOrder === "desc"
        ? ArrowDown
        : ArrowUpDown;

  const handlePrint = () => {
    window.print();
  };

  // ===== Excel export =====
  const handleExportExcel = () => {
    const rows = displayedVoters.map((v) =>
      EXPORT_COLUMNS.map((c) =>
        c.key === "electorName" ? cleanVoterName(v[c.key]) ?? "-" : v[c.key] ?? "-",
      ),
    );

    // xlsx doesn't support embedding images well, so this is text-only.
    // (Excel does render Devanagari text fine natively - no font
    // workaround needed here, unlike the PDF export.)
    const sheetData = [
      [ORG_HEADER_LINE1],
      [ORG_HEADER_LINE2],
      [],
      EXPORT_COLUMNS.map((c) => c.header),
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: EXPORT_COLUMNS.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: EXPORT_COLUMNS.length - 1 } },
    ];
    ws["!cols"] = EXPORT_COLUMNS.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voters");
    XLSX.writeFile(wb, "voter-search-results.xlsx");
  };

  // ===== PDF export =====
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      await registerDevanagariFont(doc);

      // ---- Header: photo + text ----
      let textX = 14;
      try {
        const photoBase64 = await getImageBase64(chiefPhoto);
        doc.addImage(photoBase64, "PNG", 14, 8, 16, 16); // x, y, w, h in mm
        textX = 34; // push text right so it doesn't overlap the photo
      } catch (err) {
        // If the photo fails to load for any reason, fall back to
        // text-only header rather than breaking the whole export.
        console.error("Could not embed photo in PDF:", err);
      }

      doc.setFont("NotoSansDevanagari", "bold");
      doc.setFontSize(12);
      doc.text(ORG_HEADER_LINE1, textX, 14, { maxWidth: 260 });

      doc.setFont("NotoSansDevanagari", "normal");
      doc.setFontSize(9);
      doc.text(ORG_HEADER_LINE2, textX, 20);

      // ---- Table ----
      autoTable(doc, {
        startY: 28,
        head: [EXPORT_COLUMNS.map((c) => c.header)],
        body: displayedVoters.map((v) =>
          EXPORT_COLUMNS.map((c) =>
            c.key === "electorName" ? cleanVoterName(v[c.key]) ?? "-" : v[c.key] ?? "-",
          ),
        ),
        styles: {
          fontSize: 8,
          font: "NotoSansDevanagari", // voter names/addresses are Devanagari
        },
        headStyles: {
          fillColor: [234, 88, 12], // matches the orange theme
          font: "NotoSansDevanagari",
          fontStyle: "bold",
        },
        margin: { top: 28 },
      });

      doc.save("voter-search-results.pdf");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleStatusClick = async (voter, status) => {
    setUpdatingId(voter._id);
    try {
      const updated = await api.updateVoterStatus(voter._id, status);
      onStatusChange?.(updated);
    } catch (err) {
      console.error(err);
      alert("Could not update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <section className="card results-card">
      {/* Print-only header - hidden on screen, shown at the top of the
          printed page via CSS (@media print in header-additions.css). */}
      <div className="print-only print-header">
        <img src={chiefPhoto} alt="" className="print-header-photo" />
        <div>
          <p className="print-header-line1">{ORG_HEADER_LINE1}</p>
          <p className="print-header-line2">{ORG_HEADER_LINE2}</p>
        </div>
      </div>

      <div className="results-header">
        <h2 className="section-title">
          <Users size={20} />
          SEARCH RESULT
        </h2>

        <div className="total-records-badge">
          {filters?.district ? `${filters.district} — ` : ""}
          Total Records: <strong>{voters.length}</strong>
        </div>
      </div>

      {/* Print / Excel / PDF in one row */}
      <div className="results-export-row no-print">
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={18} />
          Print
        </button>
        <button className="btn btn-success" onClick={handleExportExcel}>
          <FileSpreadsheet size={18} />
          Excel
        </button>
        <button
          className="btn btn-danger"
          onClick={handleExportPdf}
          disabled={exportingPdf}
        >
          <FileText size={18} />
          {exportingPdf ? "Generating..." : "PDF"}
        </button>
      </div>

      {/* Search box below the export row */}
      <div className="results-search-row no-print">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="नावावरून Search करा..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ===== Table (horizontal scroll + sticky Voter Name column on
          mobile via .table-wrapper / .col-name rules in index.css) ===== */}
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th className="col-id">Part No</th>
              <th className="col-id">Sr. No</th>
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
                  Voter Name
                  <SortIcon
                    size={14}
                    style={{ opacity: sortOrder ? 1 : 0.4 }}
                  />
                </span>
              </th>
              <th className="col-mobile">Mobile No.</th>
              <th className="col-institute">Institute Name</th>
              <th className="col-narrow">Village</th>
              <th className="col-narrow">Taluka</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Loading...
                </td>
              </tr>
            ) : displayedVoters.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No voters found. Try adjusting your search filters.
                </td>
              </tr>
            ) : (
              displayedVoters.map((v, idx) => {
                const statusMeta = STATUS_META[v.status] || STATUS_META.pending;
                return (
                  <tr
                    key={v._id ?? `${v.part}-${v.srNo}-${idx}`}
                    className={statusMeta.rowClass}
                  >
                    <td className="col-id">{v.part}</td>
                    <td className="col-id">{v.srNo}</td>
                    <td className="voter-name col-name">{cleanVoterName(v.electorName)}</td>
                    <td className="col-mobile">{v.mobileNo || "-"}</td>
                    <td
                      className="institute-link col-institute clickable-cell"
                      onClick={() =>
                        openExpanded("Institute Name", v.institute)
                      }
                    >
                      {v.institute}
                    </td>
                    <td className="col-narrow">{v.village || "-"}</td>
                    <td className="col-narrow">{v.taluka || "-"}</td>
                    <td className="col-status">
                      <div className="status-buttons no-print">
                        <button
                          className={`status-btn status-btn-done ${v.status === "done" ? "active" : ""}`}
                          onClick={() => handleStatusClick(v, "done")}
                          disabled={updatingId === v._id}
                          title="Done"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className={`status-btn status-btn-not-done ${v.status === "not_done" ? "active" : ""}`}
                          onClick={() => handleStatusClick(v, "not_done")}
                          disabled={updatingId === v._id}
                          title="Not Done"
                        >
                          <X size={16} />
                        </button>
                        <button
                          className={`status-btn status-btn-pending ${v.status === "pending" ? "active" : ""}`}
                          onClick={() => handleStatusClick(v, "pending")}
                          disabled={updatingId === v._id}
                          title="Pralambit (Pending)"
                        >
                          <Clock size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {expandedCell && (
        <div className="cell-modal-overlay" onClick={closeExpanded}>
          <div className="cell-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cell-modal-header">
              <span>{expandedCell.label}</span>
              <button
                className="cell-modal-close"
                onClick={closeExpanded}
                title="Close"
              >
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
    </section>
  );
}
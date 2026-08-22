// Generates IDs like PUNE-CITYSCI-0007 for each print/export action.
// The running number persists across sessions via localStorage, scoped
// separately per district + institute combination so counts never collide
// between different districts/colleges.

const DISTRICT_CODES = {
  "Pune": "PUNE",
  "Mumbai": "MUM",
  "Nagpur": "NAG",
  // add more districts here - falls back to first 4 letters if missing
};

function districtCode(name) {
  if (!name) return "GEN";
  return DISTRICT_CODES[name] || name.slice(0, 4).toUpperCase();
}

function slugCode(name) {
  if (!name) return "ALL";
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return cleaned || "ALL";
}

export function generateUniqueId(district, institute) {
  const dCode = districtCode(district);
  const iCode = slugCode(institute);
  const key = `uid-counter-${dCode}-${iCode}`;

  const current = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(current));

  const seq = String(current).padStart(4, "0");
  return `${dCode}-${iCode}-${seq}`;
}

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export default function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "-- All --",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div className="field searchable-dropdown" ref={wrapperRef}>
      <label>{label}</label>

      <div
        className={`sd-control ${open ? "sd-control--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`sd-value ${!value ? "sd-value--placeholder" : ""}`}>
          {value || placeholder}
        </span>

        {value && (
          <button type="button" className="sd-clear" onClick={handleClear} aria-label="Clear">
            <X size={14} />
          </button>
        )}

        <ChevronDown size={16} className="sd-chevron" />
      </div>

      {open && (
        <div className="sd-panel">
          <div className="sd-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search..."
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="sd-options">
            <div
              className={`sd-option ${!value ? "sd-option--selected" : ""}`}
              onClick={() => handleSelect("")}
            >
              {placeholder}
            </div>

            {filtered.length === 0 && <div className="sd-empty">No matches found</div>}

            {filtered.map((opt) => (
              <div
                key={opt}
                className={`sd-option ${opt === value ? "sd-option--selected" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
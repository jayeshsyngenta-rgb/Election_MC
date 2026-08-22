import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "../api";
import SearchableDropdown from "./SearchableDropdown";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchFilters({ onSearch }) {
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);
  const [institutes, setInstitutes] = useState([]);

  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [institute, setInstitute] = useState("");

  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(console.error);
  }, []);

  useEffect(() => {
    api.getTalukas(district).then(setTalukas).catch(console.error);
  }, [district]);

  useEffect(() => {
    api.getVillages(district, taluka).then(setVillages).catch(console.error);
  }, [district, taluka]);

  useEffect(() => {
    api.getInstitutes(district, taluka, village).then(setInstitutes).catch(console.error);
  }, [district, taluka, village]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({ district, taluka, village, institute });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, taluka, village, institute]);

  const handleReset = () => {
    setDistrict("");
    setTaluka("");
    setVillage("");
    setInstitute("");
  };

  return (
    <section className="card filters-card">
      <div className="results-header">
        <h2 className="section-title">
          <Search size={20} />
          SEARCH FILTERS
        </h2>
        <Link to="/admin/login" className="header-admin-btn no-print">
          <ShieldCheck size={16} />
          Admin
        </Link>
      </div>

      <div className="filters-grid">
        <div className="field">
          <label>जिल्हा (District)</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">-- All --</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>तालुका (Taluka)</label>
          <select value={taluka} onChange={(e) => setTaluka(e.target.value)}>
            <option value="">-- All --</option>
            {talukas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <SearchableDropdown
          label="गाव (Village)"
          value={village}
          onChange={setVillage}
          options={villages}
        />

        <SearchableDropdown
          label="Institute / School"
          value={institute}
          onChange={setInstitute}
          options={institutes}
        />
      </div>

      <div className="filters-actions">
        <button className="btn btn-navy" onClick={handleReset}>
          Reset
        </button>
      </div>
    </section>
  );
}

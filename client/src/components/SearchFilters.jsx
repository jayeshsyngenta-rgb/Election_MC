// import { useEffect, useState } from "react";
// import { Search } from "lucide-react";
// import { api } from "../api";

// // How long to wait after the last filter change before firing a search.
// const SEARCH_DEBOUNCE_MS = 300;

// export default function SearchFilters({ onSearch }) {
//   const [districts, setDistricts] = useState([]);
//   const [talukas, setTalukas] = useState([]);
//   const [villages, setVillages] = useState([]);
//   const [institutes, setInstitutes] = useState([]);

//   const [district, setDistrict] = useState("");
//   const [taluka, setTaluka] = useState("");
//   const [village, setVillage] = useState("");
//   const [institute, setInstitute] = useState("");

//   // Districts load once.
//   useEffect(() => {
//     api.getDistricts().then(setDistricts).catch(console.error);
//   }, []);

//   // Talukas: load for the current district. Runs on mount too (district
//   // is "" at first), so the Taluka dropdown is populated with every
//   // taluka right away - it does not wait for a district to be chosen.
//   useEffect(() => {
//     api
//       .getTalukas(district)
//       .then(setTalukas)
//       .catch(console.error);
//   }, [district]);

//   // Villages: load for the current district/taluka combo, whatever is
//   // set. Also runs on mount, so Village is never gated behind the
//   // others.
//   useEffect(() => {
//     api
//       .getVillages(district, taluka)
//       .then(setVillages)
//       .catch(console.error);
//   }, [district, taluka]);

//   // Institutes: same idea - loads independently of whether
//   // district/taluka/village are set.
//   useEffect(() => {
//     api
//       .getInstitutes(district, taluka, village)
//       .then(setInstitutes)
//       .catch(console.error);
//   }, [district, taluka, village]);

//   // Search fires automatically on any change to any field - picking
//   // just an institute, just a village, just a district, in any order,
//   // shows results immediately. No field is required before another.
//   //
//   // Debounced so a burst of quick changes (or the initial mount, where
//   // all four fields settle at once) only triggers a single onSearch
//   // call rather than one per field.
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       onSearch({ district, taluka, village, institute });
//     }, SEARCH_DEBOUNCE_MS);
//     return () => clearTimeout(timer);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [district, taluka, village, institute]);

//   const handleReset = () => {
//     setDistrict("");
//     setTaluka("");
//     setVillage("");
//     setInstitute("");
//   };

//   return (
//     <section className="card filters-card">
//       <h2 className="section-title">
//         <Search size={20} />
//         SEARCH FILTERS
//       </h2>

//       <div className="filters-grid">
//         <div className="field">
//           <label>जिल्हा (District)</label>
//           <select
//             value={district}
//             onChange={(e) => setDistrict(e.target.value)}
//           >
//             <option value="">-- All --</option>
//             {districts.map((d) => (
//               <option key={d} value={d}>
//                 {d}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="field">
//           <label>तालुका (Taluka)</label>
//           <select value={taluka} onChange={(e) => setTaluka(e.target.value)}>
//             <option value="">-- All --</option>
//             {talukas.map((t) => (
//               <option key={t} value={t}>
//                 {t}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="field">
//           <label>गाव (Village)</label>
//           <select value={village} onChange={(e) => setVillage(e.target.value)}>
//             <option value="">-- All --</option>
//             {villages.map((v) => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="field">
//           <label>Institute / School</label>
//           <select
//             value={institute}
//             onChange={(e) => setInstitute(e.target.value)}
//           >
//             <option value="">-- All --</option>
//             {institutes.map((i) => (
//               <option key={i} value={i}>
//                 {i}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="filters-actions">
//         <button className="btn btn-navy" onClick={handleReset}>
//           Reset
//         </button>
//       </div>
//     </section>
//   );
// }


import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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
      <h2 className="section-title">
        <Search size={20} />
        SEARCH FILTERS
      </h2>

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
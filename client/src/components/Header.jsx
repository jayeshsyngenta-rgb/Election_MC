// import { Link } from "react-router-dom";
// import { ShieldCheck } from "lucide-react";
// import "./header-additions.css";
// import chiefPhoto from "../assets/mccc.png";

// export default function Header() {
//   return (
//     <>
//       <header className="header">
//         <div className="header-inner">
//           <div className="header-brand">
//             <div className="header-photo">
//               <img src={chiefPhoto} alt="Shri Mangesh Chivate" />
//             </div>

//             <div className="header-title-group">
//               <h1 className="header-title">श्री मंगेश चिवटे</h1>
//               <p className="header-subtitle">उमेदवार – पुणे विभाग</p>
//               <p className="header-subtitle">शिक्षक मतदारसंघ निवडणूक 2026</p>
//               <p className="header-subtitle header-subtitle--muted">Voter Search Portal</p>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="header-admin-btn-row no-print">
//         <Link to="/admin/login" className="header-admin-btn">
//           <ShieldCheck size={16} />
//           Admin
//         </Link>
//       </div>
//     </>
//   );
// }


import "./header-additions.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-title-group">
            <h1 className="header-title">श्री.मंगेश चिवटे</h1>
            <p className="header-subtitle header-subtitle--candidate">
              उमेदवार – पुणे विभाग शिक्षक मतदारसंघ निवडणूक 2026
            </p>
            <p className="header-subtitle header-subtitle--muted">
              Voter Search Portal
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
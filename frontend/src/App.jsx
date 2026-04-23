import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UploadBooking from "./pages/UploadBooking";
import Declaratie from "./pages/Declaratie";
import Rezervari from "./pages/Rezervari";
import FisaTurist from "./pages/FisaTurist";
import FisaPublica from "./pages/FisaPublica";
import Curatenie from "./pages/Curatenie";
import Financiar from "./pages/Financiar";
import TermeniConditii from "./pages/TermeniConditii";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pagini publice — fără navbar */}
        <Route path="/fisa/:token" element={<FisaPublica />} />
        <Route path="/termeni" element={<TermeniConditii />} />

        {/* Pagini admin — cu navbar */}
        <Route path="/*" element={
          <>
            <nav className="navbar">
              <span className="navbar-brand">🏠 Property Management</span>
              <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                📊 Declarații
              </NavLink>
              <NavLink to="/rezervari" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                📋 Rezervări
              </NavLink>
              <NavLink to="/curatenie" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                🧹 Curățenie
              </NavLink>
              <NavLink to="/fise" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                🪪 Fișe oaspeți
              </NavLink>
              <NavLink to="/financiar" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                💳 Financiar
              </NavLink>
            </nav>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rezervari" element={<Rezervari />} />
              <Route path="/upload" element={<UploadBooking />} />
              <Route path="/declaratii/:id" element={<Declaratie />} />
              <Route path="/curatenie" element={<Curatenie />} />
              <Route path="/fise" element={<FisaTurist />} />
              <Route path="/financiar" element={<Financiar />} />
            </Routes>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

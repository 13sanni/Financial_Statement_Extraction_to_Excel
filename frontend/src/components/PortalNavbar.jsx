import { NavLink } from "react-router-dom";
import { isAdmin } from "../services/authService";

const baseItems = [
  { to: "/", label: "Home", end: true },
  { to: "/runs", label: "Runs" },
  { to: "/exports", label: "Excel" },
];

function PortalNavbar({ className = "", showAdmin = false }) {
  const canShowAdmin = showAdmin && isAdmin();
  const navItems = canShowAdmin ? [...baseItems, { to: "/maintenance", label: "Admin" }] : baseItems;
  return (
    <nav className={`w-full rounded-xl border border-slate-800 bg-slate-950/85 p-2 shadow-[0_10px_28px_rgba(2,6,23,0.65)] ${className}`}>
      <ul className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.2)]"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default PortalNavbar;

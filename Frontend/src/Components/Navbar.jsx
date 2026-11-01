

import { ChevronDown, Droplet, HandCoins, Heart, LayoutDashboard, LogOut, Menu,X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";


export default function Navbar({ user, logout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setMobileOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-red-50 text-red-600"
        : "text-gray-600 hover:bg-gray-100 hover:text-red-600"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <Heart size={23} fill="currentColor" />
          </span>

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Life<span className="text-rose-600">Drop</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/donation-requests" className={navLinkClass}>
            <Droplet size={17} />
            Donation Requests
          </NavLink>
         

          {!user ? (
            /* Before Login */
            <NavLink
              to="/login"
              className="ml-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Login
            </NavLink>
          ) : (
            /* After Login */
            <>
              <NavLink to="/funding" className={navLinkClass}>
                <HandCoins size={17} />
                Funding
              </NavLink>

              {/* User Dropdown */}
              <div className="relative ml-3">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 p-1.5 pr-3 transition hover:bg-gray-50"
                  aria-expanded={dropdownOpen}
                  aria-label="Open user menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                      {(user.displayName || user.name || user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}

                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {user.displayName || user.name || "User"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>

                    <NavLink
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-red-600"
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </NavLink>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X  size={24}/> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <NavLink
              to="/donation-requests"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <Droplet size={18} />
              Donation Requests
            </NavLink>

            {!user ? (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-lg bg-red-600 px-4 py-3 text-center font-semibold text-white hover:bg-red-700"
              >
                Login
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/funding"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <HandCoins size={18} />
                  Funding
                </NavLink>

                <div className="my-2 flex items-center gap-3 border-y border-gray-100 py-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                      {(user.displayName || user.name || user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.displayName || user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

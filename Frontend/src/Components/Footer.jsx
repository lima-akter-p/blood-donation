import { Heart, Mail, MapPin } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../context/useAuth";

const linkClass = "text-sm text-gray-400 transition hover:text-rose-300";

export default function Footer() {
  const { user, loading } = useAuth();

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" reloadDocument className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
              <Heart size={23} fill="currentColor" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              Life<span className="text-rose-500">Drop</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-gray-400">
            Connecting people who need blood with people who are willing to donate. Every drop counts.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="font-bold text-white">Explore LifeDrop</h2>
          <div className="mt-4 flex flex-col items-start gap-3">
            <Link to="/" reloadDocument className={linkClass}>Home</Link>
            <Link to="/donation-requests" reloadDocument className={linkClass}>Donation requests</Link>
            <Link to="/search" reloadDocument className={linkClass}>Search donors</Link>
            <Link to="/contact" reloadDocument className={linkClass}>Contact us</Link>
            {!loading && (user ? (
              <>
                <Link to="/funding" reloadDocument className={linkClass}>Funding</Link>
                <Link to="/dashboard" reloadDocument className={linkClass}>Dashboard</Link>
              </>
            ) : (
              <Link to="/register" reloadDocument className={linkClass}>Become a donor</Link>
            ))}
          </div>
        </nav>

        <div>
          <h2 className="font-bold text-white">Contact</h2>
          <div className="mt-4 space-y-4 text-sm text-gray-400">
            <p className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-rose-400" />
              <span>Dhaka, Bangladesh</span>
            </p>
            <p className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-rose-400" />
              <Link to="/contact" reloadDocument className={linkClass}>Send our team a message</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} LifeDrop, Lima Akter, Shahnaj Akter, All rights reserved.
      </div>
    </footer>
  );
}

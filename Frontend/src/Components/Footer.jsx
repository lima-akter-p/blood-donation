

import { Link } from "react-router";
import { Heart, Mail, MapPin } from "lucide-react";


export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          
          <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
            <Heart size={23} fill="currentColor" />
          </span>

          <span className="text-xl font-bold tracking-tight text-white">
            Life<span className="text-rose-600">Drop</span>
          </span>
        </Link>

          <p className="mt-4 max-w-sm text-sm leading-7 text-gray-400">
            Connecting people who need blood with people who are
            willing to donate. Every drop counts.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white">Quick Links</h3>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <Link to="/" className="hover:text-red-400">Home</Link>
            <Link to="/donation-requests" className="hover:text-red-400">
              Donation Requests
            </Link>
            <Link to="/search" className="hover:text-red-400">
              Search Donors
            </Link>
            <Link to="/register" className="hover:text-red-400">
              Become a Donor
            </Link>
            <Link to="/funding" className="hover:text-red-400">
              Funding
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white">Contact</h3>
          <div className="mt-4 space-y-4 text-sm text-gray-400">
            <p className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 text-red-400" />
              Dhaka, Bangladesh
            </p>
            <p className="flex items-start gap-3">
              <Mail size={18} className="shrink-0 text-red-400" />
              Contact us through our support page.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} BloodCare. All rights reserved.
      </div>
    </footer>
  );
}


import { Link } from "react-router";
import {
  Search,
  Clock,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Easy Donor Search",
    description: "Find potential donors by blood group and location.",
  },
  {
    icon: Clock,
    title: "Quick Requests",
    description: "Create and manage blood donation requests easily.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description: "Build a safer community with responsible data handling.",
  },
  {
    icon: HeartHandshake,
    title: "Community Support",
    description: "Connect people who want to help those in need.",
  },
];

export default function WhyBloodCare() {
  return (
    <>
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-semibold text-red-600">WHY BLOODCARE</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Together, We Can Save Lives
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Icon size={24} />
                </div>
                <h3 className="mt-4 font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-red-600 px-4 py-16 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Someone Needs Your Help Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
            Become part of a caring community. Your willingness to
            donate may help someone get the care they need.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-red-600 transition hover:bg-red-50"
            >
              Become a Donor <ArrowRight size={18} />
            </Link>

            <Link
              to="/donation-requests"
              className="inline-flex items-center justify-center rounded-xl border border-white/50 px-6 py-3.5 font-semibold text-white transition hover:bg-red-700"
            >
              View Requests
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

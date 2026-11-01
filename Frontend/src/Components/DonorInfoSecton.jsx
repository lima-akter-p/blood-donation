
import { Link } from "react-router";
import {
  ArrowUpRight,
  Search,
  HeartHandshake,
  ShieldCheck,
  Droplet,
  Heart,
} from "lucide-react";

const cards = [
  {
    number: "01",
    label: "FIND A DONOR",
    title: "Find the right donor.",
    description:
      "Search for available blood donors by blood group and location. Get connected with people who are ready to help.",
    link: "/search",
    linkText: "Explore donors",
    icon: Search,
    type: "search",
  },
  {
    number: "02",
    label: "BECOME A HERO",
    title: "Your blood can save a life.",
    description:
      "Join our donor community and turn a simple act of kindness into someone's second chance at life.",
    link: "/register",
    linkText: "Register as a donor",
    icon: HeartHandshake,
    type: "donor",
  },
  {
    number: "03",
    label: "DONATE SAFELY",
    title: "Stay informed. Stay safe.",
    description:
      "Make informed decisions, verify donation requests, and never pay unofficial fees for blood donations.",
    link: "/donation-requests",
    linkText: "View requests",
    icon: ShieldCheck,
    type: "safety",
  },
];

function CardVisual({ type, Icon }) {
  if (type === "search") {
    return (
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#FCE8E8]">
        <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full border-22 border-red-200/70" />
        <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-red-200/50" />

        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-red-200 bg-white shadow-xl shadow-red-900/10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Droplet
              size={54}
              strokeWidth={1.5}
              className="fill-red-600 text-red-600"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Find blood near you
        </div>

        <div className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg">
          <Icon size={23} />
        </div>
      </div>
    );
  }

  if (type === "donor") {
    return (
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#A90F20]">
        <div className="absolute inset-0 bg-linear-to-br from-red-500/60 via-transparent to-[#650713]" />
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border border-white/10" />
        <div className="absolute -right-3 -top-8 h-36 w-36 rounded-full border border-white/10" />

        <div className="relative z-10 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10">
            <Heart
              size={38}
              className="fill-white text-white"
              strokeWidth={1.4}
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-100">
            Give the gift of life
          </p>

          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            Be a Hero.
          </p>
        </div>

        <div className="absolute bottom-4 right-4 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
          Become a donor ↗
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#F0F2F5]">
      <div className="absolute -bottom-14 -right-10 h-48 w-48 rounded-full bg-slate-200" />
      <div className="absolute -left-8 -top-12 h-40 w-40 rounded-full bg-white" />

      <div className="relative z-10 w-[82%] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon size={23} />
          </div>

          <div>
            <p className="font-bold text-slate-900">
              Donate responsibly
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your safety matters.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <ShieldCheck size={15} />
          Always verify donation requests
        </div>
      </div>
    </div>
  );
}

export default function DonorInfoSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              <span className="h-px w-7 bg-red-600" />
              How You Can Help
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
              A little kindness.
              <span className="block text-red-600">
                A lifetime of hope.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-slate-600 sm:text-base md:pb-1">
            Every drop matters. Find a donor, become one, or learn how to make
            blood donation safer for everyone.
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.number}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-slate-900/6 sm:p-5"
              >
                <CardVisual type={card.type} Icon={Icon} />

                <div className="flex flex-1 flex-col px-1 pb-2 pt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-red-600">
                      {card.label}
                    </span>

                    <span className="text-xs font-semibold text-slate-400">
                      {card.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                    {card.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {card.description}
                  </p>

                  <Link
                    to={card.link}
                    className="mt-6 inline-flex w-fit items-center gap-2 border-b border-transparent pb-1 text-sm font-bold text-slate-900 transition-colors hover:border-red-600 hover:text-red-600"
                  >
                    {card.linkText}

                    <ArrowUpRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-[#111827] px-6 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
              <HeartHandshake size={25} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">
                Someone out there needs you.
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Take the first step today. Your kindness could save a life.
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl  border border-rose-500 bg-rose-600 px-7 py-4 font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Join Our Community
            <ArrowUpRight size={17} />
          </Link>
        </div>

      </div>
    </section>
  );
}


import { Link } from "react-router";
import {
  Droplet,
  Heart,
  UsersRound,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: Droplet,
    title: "Saves Lives",
    description:
      "Donated blood helps patients in critical conditions, surgeries, or those who need regular transfusions.",
  },
  {
    icon: Heart,
    title: "Builds Healthier Communities",
    description:
      "It creates awareness and encourages people to care for one another.",
  },
  {
    icon: UsersRound,
    title: "Simple and Safe",
    description:
      "The process is generally safe when performed by qualified professionals using proper procedures.",
  },
];

export default function BloodDonationAbout() {
  return (
    <section className="overflow-hidden bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.95fr_1fr] lg:gap-10 xl:gap-14">

        {/* LEFT CONTENT */}
        <div className="order-2 lg:order-1">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-0.75 w-10 rounded-full bg-rose-600" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Blood Donation
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            What is Blood
            <span className="block text-rose-600">
              Donation?
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600">
            Blood donation is the act of giving a small amount of your
            blood to help others in need. It is a safe, simple and
            life-saving process that can make a big difference in
            someone's life.
          </p>

          {/* BENEFITS */}
          <div className="mt-8 space-y-6">
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition-all duration-300 hover:bg-rose-600 hover:text-white">
                    <Icon size={27} strokeWidth={1.8} />
                  </div>

                  <div className="pt-1">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER IMAGE */}
        <div className="relative order-1 mx-auto w-full max-w-97.5 lg:order-2 lg:max-w-none">
          {/* Decorative background */}
          <div className="absolute -left-5 top-12 h-40 w-40 rounded-full bg-rose-50 sm:-left-8 sm:h-52 sm:w-52" />

          <div className="absolute -bottom-4 -right-4 h-48 w-48 rounded-full bg-rose-50 sm:-right-8 sm:h-60 sm:w-60" />

          {/* Oval image */}
          <div className="relative mx-auto aspect-[0.78] w-[88%] overflow-hidden rounded-[50%] border-2 border-rose-200 bg-rose-50 p-1.5 shadow-[0_0_0_10px_rgba(244,63,94,0.04)]">
            <img
              src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=90"
              alt="A person donating blood at a donation center"
              className="h-full w-full rounded-[50%] object-cover object-center transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Floating heart icon */}
          <div className="absolute right-0 top-[12%] flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-rose-600 text-white shadow-lg sm:-right-1 sm:h-19 sm:w-19">
            <Heart size={33} strokeWidth={2} />
          </div>

          {/* Floating donation icon */}
          <div className="absolute bottom-[5%] left-0 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 shadow-sm sm:-left-3 sm:h-24 sm:w-24">
            <Droplet size={39} strokeWidth={1.8} />
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="order-3">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-0.75 w-10 rounded-full bg-rose-600" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Our Mission
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
            Give Blood.
            <span className="mt-1 block text-rose-600">
              Give Hope.
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600">
            Every drop of blood can bring a smile back to someone's
            face, help a family, and give a second chance at life.
            Your generosity can make a real difference.
          </p>

          {/* Mission card */}
          <div className="mt-8 flex items-center gap-5 rounded-2xl border border-rose-100 bg-rose-50/80 p-5 sm:p-6">
            <div className="shrink-0 text-rose-600">
              <HeartPulse size={48} strokeWidth={1.5} />
            </div>

            <div className="h-12 w-px shrink-0 bg-rose-300" />

            <p className="text-sm font-semibold leading-6 text-slate-800 sm:text-base">
              Blood donation is not just a gift, it is a lifeline.
            </p>
          </div>

          {/* WORKING BUTTON */}
          <Link
            to="/register"
            className="group mt-8 inline-flex w-full items-center justify-center gap-4 rounded-full border-2 border-rose-600 bg-rose-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-300 hover:-translate-y-1 hover:border-rose-700 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-600/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 sm:w-auto"
          >
            Become a Donor

            <ArrowRight
              size={20}
              className="transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

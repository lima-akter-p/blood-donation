
import { Heart, Droplet, Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

const communityImages = [
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=85",
    alt: "Friends standing together as a community",
  },
  {
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=85",
    alt: "People connecting and supporting one another",
  },
  {
    src: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=600&q=85",
    alt: "Volunteers working together",
  },
  {
    src: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&q=85",
    alt: "Community volunteers helping others",
  },
];

export default function AboutLifeDrop() {
  return (
    <section id="about-life-drop" className="relative isolate scroll-mt-20 overflow-hidden bg-[#f8f8fa] px-5 py-16 sm:px-8 sm:py-20 lg:min-h-142.5 lg:px-12 lg:py-24">

      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-64 w-64 rounded-full bg-pink-100/40 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.65fr_0.9fr] lg:gap-16">

        {/* LEFT: ABOUT CONTENT */}
        <div className="relative z-10 text-center lg:text-left">

          {/* Brand Heading */}
          <div className="mb-7 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 lg:justify-start">
             <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
              About 
            </h2>

            <h2 className="text-3xl font-extrabold tracking-tight text-rose-600 sm:text-4xl lg:text-[42px]">
              LifeDrop
            </h2>

           
          </div>

          {/* Intro */}
          <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            LifeDrop.com is a blood donation platform dedicated to connecting
            blood donors with people who need blood. Our mission is to make
            finding donors easier, faster, and more accessible for everyone.
            We believe that a small act of kindness can make a life-changing
            difference.
          </p>

          <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Every day, patients need safe and timely blood donations during
            emergencies, surgeries, and medical treatments. LifeDrop.com
            encourages voluntary blood donation, raises awareness, and helps
            build a caring community where people can support one another.
            Together, we can spread hope and make a meaningful difference.
          </p>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">

            <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/70">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Heart size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Save Lives
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Every Donation Matters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/70">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Unite People
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Stronger Together
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/70">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Droplet size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Give Hope
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Be a Voluntary Donor
                </p>
              </div>
            </div>

          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Become a Donor
              <ArrowUpRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>

            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Find a Donor
            </Link>
          </div>
        </div>

        {/* RIGHT: COMMUNITY PHOTO COLLAGE */}
        <div className="relative mx-auto w-full max-w-97.5 lg:max-w-none">

          {/* Decorative Circle */}
          <div className="absolute -inset-5 rounded-full border border-rose-200/80" />
          <div className="absolute -inset-10 rounded-full border border-rose-100/70" />

          {/* Oval Photo Gallery */}
          <div className="relative aspect-[0.83] overflow-hidden rounded-[48%] border-[7px] border-white bg-rose-50 shadow-[0_25px_80px_rgba(190,24,93,0.13)]">

            <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5">
              {communityImages.map((photo, index) => (
                <div
                  key={photo.src}
                  className="group relative overflow-hidden bg-slate-200"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-slate-900/10 transition-colors duration-300 group-hover:bg-rose-900/20" />

                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-sm sm:text-xs">
                    {["Community", "Together", "Volunteers", "Kindness"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Brand Badge */}
          <div className="absolute -right-2 top-[12%] flex h-17 w-17 items-center justify-center rounded-full border-4 border-white bg-rose-600 text-white shadow-xl sm:-right-3 sm:h-20 sm:w-20">
            <div className="text-center">
              <Heart size={25} className="mx-auto fill-white" />
              <span className="mt-0.5 block text-[9px] font-extrabold tracking-wide">
                LIFEDROP
              </span>
            </div>
          </div>

          {/* Floating Message */}
          <div className="absolute -bottom-5 -left-3 flex max-w-58.75 items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-xl sm:-left-8 sm:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Heart size={25} />
            </div>

            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Give Blood. Give Hope.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Be someone's reason to smile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

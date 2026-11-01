
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Heart,
  HeartPulse,
  ShieldCheck,
  Users,
  Droplet,
} from "lucide-react";
import gsap from "gsap";

export default function Banner() {
  const bannerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Animate the text and buttons
      gsap.from(".hero-copy > *", {
        y: 35,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.15,
      });

      // 2. Reveal the heart illustration
      gsap.from(".hero-visual", {
        x: 60,
        opacity: 0,
        scale: 0.92,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.25,
      });

      // 3. Floating blood group badges
      gsap.to(".floating-badge", {
        y: -12,
        duration: 1.8,
        stagger: 0.25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 4. Slowly animate the background glow
      gsap.to(".hero-glow", {
        scale: 1.2,
        opacity: 0.65,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 5. Heartbeat effect
      gsap.to(".hero-heart", {
        scale: 1.08,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        transformOrigin: "center center",
      });
    }, bannerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={bannerRef}
      className="relative isolate overflow-hidden bg-[#080D18] text-white"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="hero-glow pointer-events-none absolute -right-20 top-10 -z-10 h-96 w-96 rounded-full bg-red-600/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-rose-700/15 blur-[100px]" />

      <div className="mx-auto grid min-h-162.5 max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:px-12 lg:py-24">
        {/* Left content */}
        <div className="hero-copy relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            Every drop can make a difference
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl">
            Be the reason
            <span className="mt-2 block text-white">
              someone gets
            </span>
            <span className="mt-2 block bg-linear-to-r from-red-400 via-rose-500 to-red-600 bg-clip-text text-transparent">
              another life.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            A small act of kindness can mean everything. Connect with blood
            donors, find urgent donation requests, and help save lives when
            every second matters.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-xl border-rose-500 bg-rose-600 px-6 py-3 text-sm font-bold text-white 
              transition-all duration-300 hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <HeartPulse size={20} />
              Become a donor
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-3 rounded-xl border
               border-rose-500 bg-rose-600 px-7 py-4 font-semibold text-white transition-all 
               duration-300 hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 "
            >
              <Users size={20} />
              Find blood donors
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-400" />
              Community-driven
            </span>
            <span className="inline-flex items-center gap-2">
              <Heart size={17} className="text-red-400" />
              Give hope, save lives
            </span>
          </div>
        </div>

        {/* Right visual */}
        <div className="hero-visual relative mx-auto flex min-h-95 w-full max-w-lg items-center justify-center sm:min-h-120">
          {/* Decorative rings */}
          <div className="absolute h-75 w-75 rounded-full border border-red-400/10 sm:h-97.5 sm:w-97.5" />
          <div className="absolute h-60 w-60 rounded-full border border-dashed border-red-400/20 sm:h-80 sm:w-[320px]" />

          {/* Central heart */}
          <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-red-400/20 bg-linear-to-br from-red-500/20 to-rose-950/40 shadow-[0_0_100px_rgba(239,68,68,0.18)] sm:h-64 sm:w-64">
            <div className="absolute inset-4 rounded-full border border-white/5" />

            <Heart
              className="hero-heart relative z-10 fill-red-600 text-red-500 drop-shadow-[0_0_28px_rgba(239,68,68,0.6)]"
              size={116}
              strokeWidth={1.2}
            />

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111827] px-5 py-2.5 text-sm font-semibold shadow-xl">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Be someone's hero
            </div>
          </div>

          {/* Floating blood group cards */}
          <div className="floating-badge absolute left-0 top-12 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-xl backdrop-blur-xl sm:left-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                <Droplet size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Blood group</p>
                <p className="text-xl font-bold">O+</p>
              </div>
            </div>
          </div>

          <div className="floating-badge absolute right-0 top-24 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-xl backdrop-blur-xl sm:right-0">
            <p className="text-xs text-slate-400">Blood group</p>
            <p className="mt-1 text-xl font-bold text-red-400">A+</p>
            <p className="mt-1 text-xs text-slate-400">Be ready to help</p>
          </div>

          <div className="floating-badge absolute bottom-16 left-2 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-xl backdrop-blur-xl sm:left-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/15 p-2.5 text-rose-400">
                <HeartPulse size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400">One donation</p>
                <p className="text-sm font-bold">A chance to live</p>
              </div>
            </div>
          </div>

          <div className="floating-badge absolute bottom-12 right-1 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-xl backdrop-blur-xl sm:right-3">
            <p className="text-xs text-slate-400">Blood group</p>
            <p className="mt-1 text-xl font-bold text-rose-400">B+</p>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-red-500/50 to-transparent" />
    </section>
  );
}

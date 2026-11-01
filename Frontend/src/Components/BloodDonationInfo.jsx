
import { useState } from "react";
import { ArrowRight, CircleArrowRight } from "lucide-react";

const infoCards = [
  {
    title: "Why Donate Blood?",
    image:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=85",
    points: [
      "Your donated blood can help save someone's life.",
      "Blood donation allows you to help people in critical situations.",
      "Regular voluntary donation is a meaningful way to serve society.",
    ],
    more:
      "Your small act of kindness can bring new hope to someone who needs medical care.",
  },
  {
    title: "Who Can Donate Blood?",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85",
    points: [
      "Generally, healthy adults aged 18 to 60 may be eligible to donate blood.",
      "Donors must meet the required weight, hemoglobin, and health criteria.",
      "A health screening and professional assessment are necessary before donation.",
    ],
    more:
      "Not everyone is eligible to donate every time. A healthcare professional will assess your health and eligibility according to applicable guidelines.",
  },
  {
    title: "Blood Donation Safety",
    image:
      "https://images.unsplash.com/photo-1615461066159-fea0960485d5?auto=format&fit=crop&w=900&q=85",
    points: [
      "Get enough sleep and eat nutritious food before donating blood.",
      "Make sure sterile equipment is used throughout the donation process.",
      "Drink plenty of fluids and rest for a while after donating blood.",
    ],
    more:
      "If you feel unwell or have any health concerns, inform the healthcare professional before donating blood.",
  },
  {
    title: "Benefits of Blood Donation",
    image:
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=900&q=85",
    points: [
      "Your donated blood can help patients receive essential medical treatment.",
      "Blood donation promotes compassion and social responsibility.",
      "Donors receive a basic health screening before donating blood.",
    ],
    more:
      "Blood donation should always be voluntary and take place in a safe environment. It can play an important role in saving lives.",
  },
  {
    title: "Common Blood Donation Myths",
    image:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=85",
    points: [
      "Safe blood donation generally does not cause permanent harm to the body.",
      "Following proper precautions before and after donation is important.",
      "Eligibility depends on your health and physical condition.",
    ],
    more:
      "For accurate information about blood donation, consult a qualified healthcare professional or an authorized blood donation center.",
  },
  {
    title: "Your Blood, Someone's New Life",
    image:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=85",
    points: [
      "Safe blood may be needed during medical emergencies.",
      "Becoming a voluntary blood donor is a valuable act of kindness.",
      "Encourage friends and family to consider donating blood.",
    ],
    more:
      "Join our community today and help people find support when they need blood donations.",
  },
];

function InfoCard({ card, index }) {
  const [expanded, setExpanded] = useState(false);
  const imageFirst = index === 1 || index === 3 || index === 5;

  const textContent = (
    <div className="flex min-h-72.5 flex-col justify-center bg-white p-6 sm:p-7 lg:p-6 xl:p-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1 w-8 rounded-full bg-rose-600" />
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          {String(index + 1).padStart(2, "0")} / Blood Care
        </span>
      </div>

      <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
        {card.title}
      </h3>

      <ul className="mt-4 list-disc space-y-2 pl-4 text-sm leading-6 text-slate-600 marker:text-rose-500">
        {card.points.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>

      {expanded && (
        <p className="mt-4 rounded-lg border-l-2 border-rose-500 bg-rose-50 p-3 text-sm leading-6 text-slate-700">
          {card.more}
        </p>
      )}

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="mt-5 inline-flex w-fit items-center gap-2 border-2 border-rose-500 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[3px_3px_0px_#fda4af] transition-all duration-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white hover:shadow-[3px_3px_0px_#cbd5e1] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        {expanded ? "Read Less" : "Read More"}
        {expanded ? (
          <ArrowRight size={16} className="-rotate-90" />
        ) : (
          <CircleArrowRight size={16} />
        )}
      </button>
    </div>
  );

  const imageContent = (
    <div className="group relative min-h-65 overflow-hidden bg-slate-100 sm:min-h-72.5">
      <img
        src={card.image}
        alt={card.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-5 left-5 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
        BLOOD DONATION • SAVE LIVES
      </span>
    </div>
  );

  return (
    <article className="grid min-w-0 grid-cols-1 overflow-hidden bg-white md:grid-cols-2">
      {imageFirst ? (
        <>
          {imageContent}
          {textContent}
        </>
      ) : (
        <>
          {textContent}
          {imageContent}
        </>
      )}
    </article>
  );
}

export default function BloodDonationInfo() {
  return (
    <section className="bg-[#f4f5f7] px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-350">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            Knowledge Saves Lives
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything About{" "}
            <span className="text-rose-600">Blood Donation</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Learn about donating blood, donor eligibility and safe practices.
            A little knowledge can make a life-changing difference.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-hidden md:grid-cols-2 md:gap-0 lg:grid-cols-3">
          {infoCards.map((card, index) => (
            <InfoCard key={card.title} card={card} index={index} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-5 bg-slate-900 px-6 py-7 sm:px-9 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">
              Be someone's hero
            </p>
            <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Your one donation can make a difference.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Become a donor and help build a healthier community.
            </p>
          </div>

          <a
            href="/register"
            className="inline-flex shrink-0 items-center gap-3 border-2 rounded-3xl border-rose-500 bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Become a Donor
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

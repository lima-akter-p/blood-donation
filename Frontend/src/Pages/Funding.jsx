import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, HandCoins, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

function formatAmount(value) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function validateAmount(value) {
  if (typeof value !== "string" || !/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) {
    return "Enter an amount with no more than two decimal places.";
  }
  const amount = Number(value);
  return amount >= 10 && amount <= 500000
    ? true
    : "Funding amount must be between BDT 10.00 and BDT 500,000.00.";
}

function validatePhone(value) {
  const normalized = value.replace(/[\s()-]/g, "");
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(normalized)
    || "Enter a valid Bangladesh mobile number.";
}

export default function Funding() {
  const { user, getFundingHistory, getFundingSummary, createFundingCheckout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fundings, setFundings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [totalFunding, setTotalFunding] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { amount: "100.00", phone: "" }, mode: "onBlur" });

  useEffect(() => {
    let active = true;
    Promise.all([
      getFundingHistory({ page }),
      getFundingSummary(),
    ])
      .then(([history, summary]) => {
        if (!active) return;
        setLoadError("");
        setFundings(history.fundings);
        setPagination(history.pagination);
        setTotalFunding(summary.totalFunding);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getFundingHistory, getFundingSummary, page, reloadKey]);

  useEffect(() => {
    if (!loadError) return;
    void Swal.fire({
      title: "Unable to load funding history",
      text: loadError,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [loadError]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (!paymentStatus) return;
    const messages = {
      success: {
        title: "Payment verified",
        text: "Thank you. Your BDT funding has been confirmed.",
        icon: "success",
      },
      failed: {
        title: "Payment was not completed",
        text: "No funding was added. You can try again when ready.",
        icon: "error",
      },
      canceled: {
        title: "Payment canceled",
        text: "No funding was added.",
        icon: "info",
      },
      verification_failed: {
        title: "Payment is not verified yet",
        text: "The gateway could not confirm this payment. If your account was charged, contact support before trying again.",
        icon: "warning",
      },
    };
    const message = messages[paymentStatus];
    if (message) {
      void Swal.fire({ ...message, confirmButtonColor: "#e11d48" }).then(() => {
        if (paymentStatus === "success") {
          setLoading(true);
          setReloadKey((current) => current + 1);
        }
      });
    }
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("payment");
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const onSubmit = async ({ amount, phone }) => {
    const confirmation = await Swal.fire({
      title: "Continue to secure payment?",
      text: `You will be redirected to SSLCOMMERZ to donate ${formatAmount(Number(amount))}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Continue to payment",
      cancelButtonText: "Review details",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    try {
      const { checkoutUrl } = await createFundingCheckout({ amount, phone });
      window.location.assign(checkoutUrl);
    } catch (error) {
      await Swal.fire({
        title: "Unable to start payment",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  const navigatePage = (nextPage) => {
    setLoading(true);
    setPage(nextPage);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </Link>
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Support our community</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">LifeDrop funding</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Every contribution helps support blood donation efforts. Payments are securely handled by SSLCOMMERZ in BDT.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <HandCoins size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Give funding</h2>
              <p className="text-sm text-slate-500">Choose an amount in BDT</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="funding-amount">
                Amount (BDT)
              </label>
              <input
                id="funding-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className={inputClass}
                aria-invalid={Boolean(errors.amount)}
                {...register("amount", { required: "Enter a funding amount.", validate: validateAmount })}
              />
              {errors.amount && <p className="mt-2 text-sm text-red-600" role="alert">{errors.amount.message}</p>}
              <p className="mt-2 text-xs text-slate-500">Minimum BDT 10.00; maximum BDT 500,000.00.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="funding-phone">
                Bangladesh mobile number
              </label>
              <input
                id="funding-phone"
                type="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                className={inputClass}
                aria-invalid={Boolean(errors.phone)}
                {...register("phone", { required: "Enter a mobile number for the payment.", validate: validatePhone })}
              />
              {errors.phone && <p className="mt-2 text-sm text-red-600" role="alert">{errors.phone.message}</p>}
            </div>

            <div className="flex gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={18} />
              <p>Card and mobile financial service details are entered only on the SSLCOMMERZ secure checkout.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Preparing secure checkout…" : "Give funding"}
            </button>
            <p className="text-center text-xs text-slate-500">Signed in as {user.name}</p>
          </form>
        </section>

        <section className="min-w-0">
          <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-7">
            <p className="text-sm font-semibold text-slate-300">Verified community contributions</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {totalFunding === null ? "Loading…" : formatAmount(totalFunding)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Only payments verified by SSLCOMMERZ are included.</p>
          </article>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">Funding history</h2>
                <p className="mt-1 text-xs text-slate-500">{pagination.total} verified contributions</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Verified</span>
            </div>
            {loading ? (
              <div className="px-5 py-14 text-center text-sm text-slate-500" role="status">Loading funding history…</div>
            ) : fundings.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="font-semibold text-slate-800">No verified funding yet</p>
                <p className="mt-2 text-sm text-slate-500">Be the first to support the LifeDrop community.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Contributor</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Funding date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundings.map((funding) => (
                      <tr key={funding.id} className="border-t border-slate-100 text-sm">
                        <td className="px-5 py-4 font-semibold text-slate-800">{funding.donorName}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">{formatAmount(funding.amount)}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(funding.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-between" aria-label="Funding history pages">
              <button
                type="button"
                onClick={() => navigatePage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <ChevronLeft size={17} /> Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {pagination.totalPages}</span>
              <button
                type="button"
                onClick={() => navigatePage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Next <ChevronRight size={17} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

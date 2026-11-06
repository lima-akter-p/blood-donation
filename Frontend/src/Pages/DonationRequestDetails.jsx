import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Detail({ label, children }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-800">{children || "Not provided"}</dd>
    </div>
  );
}

export default function DonationRequestDetails() {
  const { requestId } = useParams();
  const { user, getPendingDonationRequest, confirmDonation } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { donorName: user.name, donorEmail: user.email } });

  useEffect(() => {
    let active = true;
    const loadRequest = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getPendingDonationRequest(requestId);
        if (active) setRequest(result.request);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRequest();
    return () => {
      active = false;
    };
  }, [getPendingDonationRequest, requestId]);

  useEffect(() => {
    if (!error) return;
    void Swal.fire({
      title: "Unable to open donation request",
      text: error,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [error]);

  const userId = String(user?.id ?? user?._id ?? "");
  const userRole = String(user?.role ?? "").trim().toLowerCase();
  const isRequester = Boolean(userId && request?.requesterId === userId);
  const isAcceptedDonor = Boolean(userId && request?.donorId === userId);
  const canConfirmDonation = request?.status === "pending"
    && userRole === "donor"
    && (user?.donorVerificationStatus || "verified") === "verified"
    && !isRequester;

  const onConfirmDonation = async () => {
    const confirmation = await Swal.fire({
      title: "Confirm your donation?",
      text: "The requester will be notified that you are in contact to donate.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm donation",
      cancelButtonText: "Go back",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    try {
      const result = await confirmDonation(requestId);
      setRequest(result.request);
      setConfirmationOpen(false);
      await Swal.fire({
        title: result.notification?.sent
          ? "Thank you for stepping forward"
          : "Donation confirmed",
        text: result.notification?.message
          || "Your contact information has been shared with the requester.",
        icon: result.notification?.sent ? "success" : "warning",
        confirmButtonColor: "#e11d48",
      });
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to confirm donation",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/donation-requests" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800">
          <ArrowLeft size={17} /> Back to requests
        </Link>
        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500" role="status">
            Loading request details…
          </div>
        ) : error || !request ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <h1 className="text-xl font-bold text-slate-900">Request unavailable</h1>
            <p className="mt-2 text-sm text-slate-600">{error || "This request could not be found."}</p>
          </div>
        ) : (
          <>
            <header className="mt-6 rounded-3xl bg-slate-950 px-6 py-8 text-white sm:px-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Donation request</p>
                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{request.recipientName}</h1>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={17} />{request.recipientUpazila}, {request.recipientDistrict}
                  </p>
                </div>
                <span className="rounded-full bg-rose-500/15 px-4 py-2 text-lg font-extrabold text-rose-200">{request.bloodGroup}</span>
              </div>
            </header>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Request information</h2>
              <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
                <Detail label="Requester">{request.requesterName}</Detail>
                <Detail label="Requester email">{request.requesterEmail}</Detail>
                <Detail label="Hospital">{request.hospitalName}</Detail>
                <Detail label="Full address">{request.fullAddress}</Detail>
                <Detail label="Donation date"><span className="inline-flex items-center gap-2"><CalendarDays size={16} />{formatDate(request.donationDate)}</span></Detail>
                <Detail label="Donation time"><span className="inline-flex items-center gap-2"><Clock3 size={16} />{request.donationTime}</span></Detail>
                <Detail label="Status"><span className="capitalize">{request.status === "inprogress" ? "In progress" : request.status}</span></Detail>
                <Detail label="Request message">{request.requestMessage}</Detail>
              </dl>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Status timeline</h2>
              {request.statusHistory?.length ? (
                <ol className="mt-5 space-y-5">
                  {request.statusHistory.map((entry, index) => (
                    <li key={`${entry.status}-${entry.changedAt}-${index}`} className="relative flex gap-4">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 border-b border-slate-100 pb-4 last:border-b-0">
                        <p className="font-semibold capitalize text-slate-900">
                          {entry.status === "inprogress" ? "In progress" : entry.status}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Updated by {entry.changedByName || "LifeDrop member"}
                        </p>
                        <time className="mt-1 block text-xs text-slate-500" dateTime={entry.changedAt}>
                          {formatTimestamp(entry.changedAt)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Status history is available for updates recorded after this feature was added.
                </p>
              )}
            </section>

            {canConfirmDonation && (
              <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/70 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Can you donate?</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Confirm to share your name and email with the requester.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmationOpen(true)}
                  className="mt-4 w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 sm:mt-0 sm:w-auto"
                >
                  Donate
                </button>
              </div>
            )}
            {request.status === "pending" && isRequester && (
              <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
                You created this request. Another donor can confirm the donation.
              </p>
            )}
            {isAcceptedDonor && request.status === "inprogress" && (
              <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-800">
                You confirmed this donation. The requester has your contact details.
              </p>
            )}
          </>
        )}
      </div>

      {confirmationOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-donation-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <h2 id="confirm-donation-title" className="text-xl font-extrabold text-slate-900">Confirm your donation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">These read-only details will be shared with the requester.</p>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit(onConfirmDonation)}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donor-name">Donor name</label>
                <input id="donor-name" className={inputClass} readOnly {...register("donorName")} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donor-email">Donor email</label>
                <input id="donor-email" type="email" className={inputClass} readOnly {...register("donorEmail")} />
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmationOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Confirming…" : "Confirm donation"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none";

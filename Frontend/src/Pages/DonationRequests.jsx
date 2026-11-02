import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import { getPendingDonationRequests } from "../services/donationRequestApi";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export default function DonationRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getPendingDonationRequests({ page });
        if (!active) return;
        setRequests(result.requests);
        setPagination(result.pagination);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRequests();
    return () => {
      active = false;
    };
  }, [page]);

  useEffect(() => {
    if (!error) return;
    void Swal.fire({
      title: "Unable to load donation requests",
      text: error,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [error]);

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Help someone in need</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Pending donation requests</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Browse current requests for blood and view the details to offer a donation.
          </p>
        </header>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Pending requests</h2>
          {!loading && <p className="text-sm text-slate-500">{pagination.total} found</p>}
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500" role="status">
            Loading pending requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-900">No pending requests found</p>
            <p className="mt-2 text-sm text-slate-600">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <article key={request.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Blood needed</p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-900">{request.recipientName}</h3>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700">{request.bloodGroup}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0 text-rose-500" />{request.recipientUpazila}, {request.recipientDistrict}</p>
                  <p><span className="font-semibold text-slate-800">Date:</span> {formatDate(request.donationDate)}</p>
                  <p><span className="font-semibold text-slate-800">Time:</span> {request.donationTime}</p>
                </div>
                <Link
                  to={`/donation-requests/${request.id}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  View request
                </Link>
              </article>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-between" aria-label="Pending request pages">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={17} /> Previous
            </button>
            <span className="text-sm text-slate-600">Page {page} of {pagination.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight size={17} />
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

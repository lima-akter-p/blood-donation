import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";
import MyDonationRequests from "./MyDonationRequests";

const statuses = ["pending", "inprogress", "done", "canceled"];
const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  inprogress: "bg-sky-50 text-sky-700",
  done: "bg-emerald-50 text-emerald-700",
  canceled: "bg-slate-100 text-slate-600",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export default function VolunteerDonationRequests() {
  const {
    user,
    getAllDonationRequests,
    updateDonationRequestStatus,
    deleteDonationRequest,
  } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRequestId, setBusyRequestId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getAllDonationRequests({ page, status: status || undefined });
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
  }, [getAllDonationRequests, page, status, reloadKey]);

  useEffect(() => {
    if (!error) return;
    void Swal.fire({
      title: "Unable to load donation requests",
      text: error,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [error]);

  const updateStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleStatusUpdate = async (request, nextStatus) => {
    if (nextStatus === request.status) return;
    const confirmation = await Swal.fire({
      title: "Update donation request status?",
      text: `Change the request for ${request.recipientName} from ${request.status} to ${nextStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Update status",
      cancelButtonText: "Keep current status",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    setBusyRequestId(request.id);
    try {
      const result = await updateDonationRequestStatus(request.id, nextStatus);
      setReloadKey((current) => current + 1);
      await Swal.fire({
        title: "Request status updated",
        text: result.notification?.message || "",
        icon: result.notification?.sent === false ? "warning" : "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to update status",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusyRequestId("");
    }
  };

  const handleDelete = async (request) => {
    const confirmation = await Swal.fire({
      title: "Delete your donation request?",
      text: `The request for ${request.recipientName} will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete request",
      cancelButtonText: "Keep request",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    setBusyRequestId(request.id);
    try {
      await deleteDonationRequest(request.id);
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      if (requests.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((current) => current + 1);
      }
      await Swal.fire({
        title: "Request deleted",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to delete request",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusyRequestId("");
    }
  };

  if (user.role === "admin") {
    return <MyDonationRequests />;
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Volunteer workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Manage Donation Requests</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review all community requests, update statuses, and manage requests you created.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700" htmlFor="volunteer-request-status">
          Filter by status
          <select
            id="volunteer-request-status"
            value={status}
            onChange={(event) => updateStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>{value === "inprogress" ? "In progress" : value}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-500">
          {pagination.total} {pagination.total === 1 ? "request" : "requests"}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-slate-500" role="status">
            Loading donation requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-900">No donation requests found</p>
            <p className="mt-2 text-sm text-slate-600">
              {status ? "Try another status filter." : "There are no requests to review right now."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Recipient / blood group</th>
                  <th className="px-4 py-3">Hospital / location</th>
                  <th className="px-4 py-3">Donation date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{request.requesterName}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.requesterEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p className="font-semibold text-slate-900">{request.recipientName}</p>
                      <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {request.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{request.hospitalName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.recipientUpazila}, {request.recipientDistrict}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(request.donationDate)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{request.donationTime}</td>
                    <td className="px-4 py-4">
                      <label className="sr-only" htmlFor={`request-status-${request.id}`}>Update status for {request.recipientName}</label>
                      <select
                        id={`request-status-${request.id}`}
                        value={request.status}
                        onChange={(event) => void handleStatusUpdate(request, event.target.value)}
                        disabled={busyRequestId === request.id}
                        className={`rounded-lg border-0 px-3 py-2 text-xs font-bold capitalize outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50 ${statusStyles[request.status]}`}
                      >
                        {statuses.map((value) => (
                          <option key={value} value={value}>{value === "inprogress" ? "In progress" : value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/donation-requests/${request.id}`}
                          aria-label={`View request for ${request.recipientName}`}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </Link>
                        {request.requesterId === user.id && (
                          <Link
                            to={`/dashboard/my-donation-requests/${request.id}/edit`}
                            aria-label={`Edit your request for ${request.recipientName}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                        )}
                        {request.requesterId === user.id && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(request)}
                            disabled={busyRequestId === request.id}
                            aria-label={`Delete your request for ${request.recipientName}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                        {request.status === "inprogress" && request.donorName && (
                          <span className="basis-full text-xs text-slate-500">
                            Donor: {request.donorName} · {request.donorEmail}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Donation request pages">
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
    </section>
  );
}

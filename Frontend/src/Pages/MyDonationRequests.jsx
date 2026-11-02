import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

const statuses = ["pending", "inprogress", "done", "canceled"];
const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  inprogress: "bg-sky-50 text-sky-700",
  done: "bg-emerald-50 text-emerald-700",
  canceled: "bg-slate-100 text-slate-600",
};

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function RequestRow({ request, onDelete, onUpdateStatus, busy, isAdmin }) {
  return (
    <tr className="border-t border-slate-100 text-sm">
      <td className="px-4 py-4">
        <p className="font-semibold text-slate-900">{request.recipientName}</p>
        <p className="mt-1 text-slate-500">{request.hospitalName}</p>
        {isAdmin && (
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Requested by {request.requesterName}<br />{request.requesterEmail}
          </p>
        )}
      </td>
      <td className="px-4 py-4 text-slate-600">
        {request.recipientUpazila}, {request.recipientDistrict}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
          {request.bloodGroup}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatDate(request.donationDate)} · {request.donationTime}
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[request.status]}`}>
          {request.status === "inprogress" ? "In progress" : request.status}
        </span>
        {request.status === "inprogress" && request.donorName && (
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Donor: {request.donorName}<br />{request.donorEmail}
          </p>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/donation-requests/${request.id}`}
            aria-label={`View request for ${request.recipientName}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View
          </Link>
          {request.status === "pending" && (
            <Link
              to={`/dashboard/my-donation-requests/${request.id}/edit`}
              aria-label={`Edit request for ${request.recipientName}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={14} />
              Edit
            </Link>
          )}
          {request.status === "inprogress" && (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(request, "done")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                <Check size={14} />
                Done
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(request, "canceled")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onDelete(request)}
            disabled={busy}
            aria-label={`Delete request for ${request.recipientName}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MyDonationRequests() {
  const {
    user,
    getMyDonationRequests,
    getAllDonationRequests,
    deleteDonationRequest,
    updateDonationRequestStatus,
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
        const result = user.role === "admin"
          ? await getAllDonationRequests({ page, status: status || undefined })
          : await getMyDonationRequests({ page, status: status || undefined });
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
  }, [getAllDonationRequests, getMyDonationRequests, page, status, reloadKey, user.role]);

  useEffect(() => {
    if (!error) return;
    Swal.fire({
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

  const handleDelete = async (request) => {
    const confirmation = await Swal.fire({
      title: "Delete this donation request?",
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

  const handleStatusUpdate = async (request, nextStatus) => {
    const isDone = nextStatus === "done";
    const confirmation = await Swal.fire({
      title: isDone ? "Mark this donation as done?" : "Cancel this donation?",
      text: `This changes the request for ${request.recipientName} to ${isDone ? "done" : "canceled"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isDone ? "Mark as done" : "Cancel donation",
      cancelButtonText: "Keep in progress",
      confirmButtonColor: isDone ? "#059669" : "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    setBusyRequestId(request.id);
    try {
      const result = await updateDonationRequestStatus(request.id, nextStatus);
      setReloadKey((current) => current + 1);
      await Swal.fire({
        title: isDone ? "Donation marked done" : "Donation canceled",
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

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
            {user.role === "admin" ? "Administrator workspace" : "Donor workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {user.role === "admin" ? "All donation requests" : "My donation requests"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {user.role === "admin"
              ? "Manage all community requests, including their details, status, and removal."
              : "Review requests you created and track their current status."}
          </p>
        </div>
        <Link
          to="/dashboard/create-donation-request"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
        >
          <Plus size={18} />
          Create request
        </Link>
      </div>

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          Filter by status
          <select
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
            Loading your donation requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-900">No donation requests found</p>
            <p className="mt-2 text-sm text-slate-600">
              {status
                ? "Try another status filter."
                : user.role === "admin"
                  ? "There are no requests to manage yet."
                  : "Create a request to help someone find a donor."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Blood group</th>
                  <th className="px-4 py-3">Donation date / time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    busy={busyRequestId === request.id}
                    onDelete={handleDelete}
                    onUpdateStatus={handleStatusUpdate}
                    isAdmin={user.role === "admin"}
                  />
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
            <ChevronLeft size={17} />
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page} of {pagination.totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            disabled={page >= pagination.totalPages || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={17} />
          </button>
        </nav>
      )}

      {!loading && requests.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-500">
          Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
        </p>
      )}
    </section>
  );
}

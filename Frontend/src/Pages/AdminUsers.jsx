import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Shield, ShieldCheck, UserRound } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

const statuses = ["active", "blocked"];

function UserAvatar({ user }) {
  return user.avatar ? (
    <img src={user.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
      <UserRound size={20} />
    </span>
  );
}

export default function AdminUsers() {
  const {
    user: currentUser,
    getAdminUsers,
    updateAdminUserStatus,
    updateAdminUserRole,
  } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getAdminUsers({ page, status: status || undefined });
        if (!active) return;
        setUsers(result.users);
        setPagination(result.pagination);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadUsers();
    return () => {
      active = false;
    };
  }, [getAdminUsers, page, status, reloadKey]);

  useEffect(() => {
    if (!error) return;
    void Swal.fire({
      title: "Unable to load users",
      text: error,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [error]);

  const handleStatusChange = async (target) => {
    const nextStatus = target.status === "active" ? "blocked" : "active";
    const blocking = nextStatus === "blocked";
    const confirmation = await Swal.fire({
      title: blocking ? "Block this account?" : "Unblock this account?",
      text: `${target.name} will ${blocking ? "no longer be able to sign in" : "be able to sign in again"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: blocking ? "Block account" : "Unblock account",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    setBusyUserId(target.id);
    try {
      await updateAdminUserStatus(target.id, nextStatus);
      setReloadKey((value) => value + 1);
      await Swal.fire({
        title: blocking ? "Account blocked" : "Account unblocked",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to update account status",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusyUserId("");
    }
  };

  const handleRoleChange = async (target, role) => {
    const title = role === "admin" ? "Promote to administrator?" : "Promote to volunteer?";
    const confirmation = await Swal.fire({
      title,
      text: `${target.name} will gain ${role === "admin" ? "administrator" : "volunteer"} permissions.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm promotion",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
    });
    if (!confirmation.isConfirmed) return;

    setBusyUserId(target.id);
    try {
      await updateAdminUserRole(target.id, role);
      setReloadKey((value) => value + 1);
      await Swal.fire({
        title: "Role updated",
        text: `${target.name} is now ${role === "admin" ? "an administrator" : "a volunteer"}.`,
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to update role",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusyUserId("");
    }
  };

  const updateStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Administrator workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">All users</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review accounts, manage access, and promote donors to volunteer or administrator.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700" htmlFor="user-status-filter">
          Filter by status
          <select
            id="user-status-filter"
            value={status}
            onChange={(event) => updateStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <p className="text-sm text-slate-500">
          {pagination.total} {pagination.total === 1 ? "user" : "users"}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-slate-500" role="status">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-900">No users found</p>
            <p className="mt-2 text-sm text-slate-600">{status ? "Try another status filter." : "User accounts will appear here."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Location / group</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Administration</th>
                </tr>
              </thead>
              <tbody>
                {users.map((target) => {
                  const isSelf = target.id === currentUser.id;
                  const canPromoteToVolunteer = target.role === "donor";
                  const canPromoteToAdmin = target.role === "donor" || target.role === "volunteer";
                  const busy = busyUserId === target.id;
                  return (
                    <tr key={target.id} className="border-t border-slate-100 text-sm">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={target} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{target.name}{isSelf ? " (you)" : ""}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{target.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {target.bloodGroup}
                        <p className="mt-1 text-xs text-slate-500">{target.upazila}, {target.district}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                          {target.role === "admin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {target.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${target.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {target.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(target)}
                                disabled={busy}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${target.status === "active" ? "border border-red-100 text-red-700 hover:bg-red-50" : "border border-emerald-100 text-emerald-700 hover:bg-emerald-50"}`}
                              >
                                {target.status === "active" ? "Block" : "Unblock"}
                              </button>
                              {canPromoteToVolunteer && (
                                <button
                                  type="button"
                                  onClick={() => handleRoleChange(target, "volunteer")}
                                  disabled={busy}
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Make volunteer
                                </button>
                              )}
                              {canPromoteToAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRoleChange(target, "admin")}
                                  disabled={busy}
                                  className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                                >
                                  Make admin
                                </button>
                              )}
                            </>
                          )}
                          {isSelf && <span className="text-xs text-slate-500">Your account is protected</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="User pages">
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

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Notifications() {
  const {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
  } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getNotifications(page), getUnreadNotificationCount()])
      .then(([result, unread]) => {
        if (!active) return;
        setNotifications(result.notifications);
        setPagination(result.pagination);
        setUnreadCount(unread.unreadCount);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getNotifications, getUnreadNotificationCount, page]);

  const changePage = (nextPage) => {
    setLoading(true);
    setError("");
    setPage(nextPage);
  };

  const handleOpenNotification = async (notification) => {
    if (notification.isRead) {
      navigate(`/donation-requests/${encodeURIComponent(notification.requestId)}`);
      return;
    }

    setBusy(true);
    try {
      await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
      navigate(`/donation-requests/${encodeURIComponent(notification.requestId)}`);
    } catch (readError) {
      await Swal.fire({
        title: "Unable to open notification",
        text: readError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (readError) {
      await Swal.fire({
        title: "Unable to mark notifications as read",
        text: readError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Updates</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Status changes for donation requests you created or joined appear here.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={busy || unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </header>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500" role="status">Loading notifications…</div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-red-700">Could not load notifications</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Bell size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">You’re all caught up</p>
            <p className="mt-1 text-sm text-slate-500">Request status updates will show here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleOpenNotification(notification)}
                  className={`flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-slate-50 disabled:cursor-wait sm:px-6 ${
                    notification.isRead ? "bg-white" : "bg-rose-50/60"
                  }`}
                >
                  <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-700"
                  }`}>
                    <Bell size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{notification.title}</span>
                      {!notification.isRead && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
                    <time className="mt-2 block text-xs text-slate-500" dateTime={notification.createdAt}>
                      {formatTimestamp(notification.createdAt)}
                    </time>
                  </span>
                  <ChevronRight size={18} className="mt-2 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && pagination.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Notification pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {pagination.totalPages}</span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => changePage(page + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Next <ChevronRight size={17} />
          </button>
        </nav>
      )}
      <Link to="/dashboard" className="mt-5 inline-flex text-sm font-semibold text-rose-700 hover:text-rose-800">
        Back to dashboard
      </Link>
    </section>
  );
}

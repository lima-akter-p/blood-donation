import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mail, MailOpen, Phone } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ContactMessages() {
  const { getContactMessages, markContactMessageRead } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyMessageId, setBusyMessageId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getContactMessages({ page })
      .then((result) => {
        if (!active) return;
        setMessages(result.messages);
        setPagination(result.pagination);
        setUnreadCount(result.unreadCount);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getContactMessages, page, reloadKey]);

  useEffect(() => {
    if (!error) return;
    void Swal.fire({
      title: "Unable to load contact messages",
      text: error,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [error]);

  const handleMarkRead = async (message) => {
    setBusyMessageId(message.id);
    try {
      await markContactMessageRead(message.id);
      setUnreadCount((current) => Math.max(0, current - 1));
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      await Swal.fire({
        title: "Unable to update message",
        text: requestError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusyMessageId("");
    }
  };

  const navigatePage = (nextPage) => {
    setLoading(true);
    setPage(nextPage);
  };

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Administrator workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Contact messages</h1>
          <p className="mt-2 text-sm text-slate-600">Review messages sent from the public contact form.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700">
          <Mail size={16} /> {unreadCount} unread
        </span>
      </header>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500" role="status">
            Loading contact messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <p className="font-bold text-slate-900">No contact messages yet</p>
            <p className="mt-2 text-sm text-slate-500">New public messages will appear here.</p>
          </div>
        ) : messages.map((message) => (
          <article key={message.id} className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${message.isRead ? "border-slate-200" : "border-rose-200"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{message.subject}</h2>
                  {!message.isRead && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">New</span>}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{message.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <a href={`mailto:${message.email}`} className="hover:text-rose-700">{message.email}</a>
                  {message.phone && (
                    <a href={`tel:${message.phone}`} className="inline-flex items-center gap-1 hover:text-rose-700">
                      <Phone size={14} /> {message.phone}
                    </a>
                  )}
                  <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
              </div>
              {!message.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(message)}
                  disabled={busyMessageId === message.id}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <MailOpen size={16} />
                  {busyMessageId === message.id ? "Updating…" : "Mark as read"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Contact message pages">
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
  );
}

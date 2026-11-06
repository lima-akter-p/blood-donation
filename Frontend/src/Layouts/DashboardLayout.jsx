import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  ClipboardList,
  Droplet,
  HandCoins,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  ShieldCheck,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

const baseNavigation = [
  { label: "Dashboard home", path: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My profile", path: "/dashboard/profile", icon: UserRound },
];
const requestNavigation = [
  { label: "My donation requests", path: "/dashboard/my-donation-requests", icon: ClipboardList },
  { label: "Create request", path: "/dashboard/create-donation-request", icon: Plus },
];

const roleLabels = {
  donor: "Donor",
  volunteer: "Volunteer",
  admin: "Administrator",
};

function UserIdentity({ user, compact = false }) {
  return (
    <div className={`flex min-w-0 items-center ${compact ? "gap-3" : "gap-3 px-4 py-4"}`}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
          {(user.name || user.email || "U").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}

function SidebarContent({ user, onNavigate, onLogout }) {
  const role = user.role?.trim().toLowerCase();
  const navigation = [
    ...baseNavigation,
    ...(role === "donor" && user.status === "active" && (user.donorVerificationStatus || "verified") === "verified"
      ? requestNavigation
      : []),
    ...(role === "admin" && user.status === "active" ? [
      { label: "Create request", path: "/dashboard/create-donation-request", icon: Plus },
      { label: "All donation requests", path: "/dashboard/all-blood-donation-request", icon: ClipboardList },
      { label: "All users", path: "/dashboard/all-users", icon: UserRound },
      { label: "Donor verification", path: "/dashboard/donor-verifications", icon: ShieldCheck },
      { label: "Contact messages", path: "/dashboard/contact-messages", icon: Mail },
    ] : []),
    ...(role === "volunteer" && user.status === "active" ? [{
      label: "Manage Donation Requests",
      path: "/dashboard/manage-donation-requests",
      icon: ClipboardList,
    }] : []),
    { label: "Donation", path: "/funding", icon: HandCoins },
  ];

  return (
    <>
      <div className="border-b border-slate-100 px-5 py-5">
        <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
            <Heart size={22} fill="currentColor" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Life<span className="text-rose-600">Drop</span>
          </span>
        </Link>
        <p className="mt-1 pl-[52px] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {roleLabels[user.role] || "Member"} portal
        </p>
      </div>

      <div className="border-b border-slate-100">
        <UserIdentity user={user} />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Dashboard navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>
        {navigation.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-rose-50 text-rose-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={16} className="text-current opacity-50" />
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-100 p-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-700"
        >
          <ArrowLeft size={18} />
          Return to LifeDrop
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );
}

function DashboardHome({ user }) {
  const { getAdminDashboardStats, getFundingSummary } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [statsError, setStatsError] = useState("");
  const firstName = user.name?.trim().split(/\s+/)[0] || "there";
  const nextAvailableDate = user.nextAvailableDate
    ? new Date(`${user.nextAvailableDate}T00:00:00.000Z`)
    : null;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const daysUntilAvailable = nextAvailableDate
    ? Math.ceil((nextAvailableDate.getTime() - todayUtc.getTime()) / 86400000)
    : null;
  const monthlyPeak = Math.max(1, ...(statistics?.monthlyRequests || []).map((item) => item.requests));
  const roleDescription = {
    donor: "Manage your donor profile and stay connected with your community.",
    volunteer: "Your volunteer workspace will bring community requests and updates together.",
    admin: "Your administration workspace will bring community activity and management tools together.",
  }[user.role] || "Your LifeDrop workspace is ready.";

  useEffect(() => {
    if (user.role !== "admin" && user.role !== "volunteer") return undefined;
    let active = true;
    const request = user.role === "admin"
      ? getAdminDashboardStats()
      : getFundingSummary().then((result) => ({ statistics: { totalFunding: result.totalFunding } }));
    request
      .then(({ statistics: result }) => {
        if (active) setStatistics(result);
      })
      .catch((error) => {
        if (active) setStatsError(error.message);
      });
    return () => {
      active = false;
    };
  }, [getAdminDashboardStats, getFundingSummary, user.role]);

  useEffect(() => {
    if (!statsError) return;
    void Swal.fire({
      title: "Unable to load dashboard statistics",
      text: statsError,
      icon: "error",
      confirmButtonColor: "#e11d48",
    });
  }, [statsError]);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-11">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
            <Droplet size={14} />
            {roleLabels[user.role] || "LifeDrop"} workspace
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome, {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            {roleDescription}
          </p>
          <Link
            to="/dashboard/profile"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/40"
          >
            Review your profile
            <ChevronRight size={17} />
          </Link>
          {(["volunteer", "admin"].includes(user.role?.trim().toLowerCase())) && (
            <Link
              to={user.role?.trim().toLowerCase() === "volunteer"
                ? "/dashboard/manage-donation-requests"
                : "/dashboard/all-blood-donation-request"}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 sm:ml-3"
            >
              {user.role === "admin" ? "Manage all requests" : "Manage Donation Requests"}
              <ChevronRight size={17} />
            </Link>
          )}
        </div>
      </div>

      {user.role?.trim().toLowerCase() === "donor"
        && (user.donorVerificationStatus || "verified") !== "verified" && (
        <aside className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5" aria-live="polite">
          <p className="text-sm font-bold text-sky-950">
            {user.donorVerificationStatus === "rejected" ? "Donor verification needs resubmission" : "Donor verification is pending"}
          </p>
          <p className="mt-1 text-sm leading-6 text-sky-900">
            {user.donorVerificationStatus === "rejected"
              ? "Please open your profile to submit a new certificate. Donor features are unavailable until approval."
              : "Your certificate is waiting for private administrator review. Donor features will be enabled after approval."}
          </p>
          <Link to="/dashboard/profile" className="mt-3 inline-flex text-sm font-bold text-sky-950 underline underline-offset-2">
            {user.donorVerificationStatus === "rejected" ? "Resubmit verification" : "View verification status"}
          </Link>
        </aside>
      )}

      {user.role?.trim().toLowerCase() === "donor"
        && nextAvailableDate
        && (daysUntilAvailable >= 0 || user.isAvailable === false) && (
        <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-live="polite">
          <p className="text-sm font-bold text-amber-900">Donor availability reminder</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            {daysUntilAvailable > 0
              ? `Your self-reported availability date is in ${daysUntilAvailable} ${daysUntilAvailable === 1 ? "day" : "days"}.`
              : daysUntilAvailable === 0
                ? "Your self-reported availability date is today. Review your availability setting before appearing in donor search."
                : "Your self-reported availability date has passed. Review your availability setting in your profile."}
          </p>
          <Link to="/dashboard/profile" className="mt-3 inline-flex text-sm font-bold text-amber-900 underline underline-offset-2">
            Review donor availability
          </Link>
        </aside>
      )}

      {(user.role === "admin" || user.role === "volunteer") && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(user.role === "admin" ? [
              {
                label: "Total donors",
                value: statistics?.donorCount,
                icon: Users,
                color: "bg-sky-50 text-sky-700",
              },
              {
                label: "Total funding",
                value: statistics?.totalFunding,
                icon: HandCoins,
                color: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Donation requests",
                value: statistics?.donationRequestCount,
                icon: ClipboardList,
                color: "bg-rose-50 text-rose-700",
              },
            ] : [{
              label: "Total funding",
              value: statistics?.totalFunding,
              icon: HandCoins,
              color: "bg-emerald-50 text-emerald-700",
            }]).map(({ label, value, icon: Icon, color }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={21} />
                </span>
                <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {value === undefined ? "—" : label === "Total funding"
                    ? new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(value)
                    : value}
                </p>
              </article>
            ))}
          </div>
          {user.role === "admin" && statistics?.requestStatuses && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-lg font-bold text-slate-900">Donation request status</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["Pending", statistics.requestStatuses.pending, "bg-amber-400"],
                  ["In progress", statistics.requestStatuses.inprogress, "bg-sky-500"],
                  ["Done", statistics.requestStatuses.done, "bg-emerald-500"],
                  ["Canceled", statistics.requestStatuses.canceled, "bg-slate-400"],
                ].map(([label, count, color]) => {
                  const percentage = statistics.donationRequestCount
                    ? Math.round((count / statistics.donationRequestCount) * 100)
                    : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-slate-500">{count} · {percentage}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {user.role === "admin" && statistics?.monthlyRequests && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Request activity</h2>
                <p className="mt-1 text-sm text-slate-500">Requests created and completed in the last six months</p>
              </div>
              <div className="mt-6 grid grid-cols-6 gap-2 sm:gap-4" role="img" aria-label="Monthly donation requests created and completed">
                {statistics.monthlyRequests.map(({ month, requests, completed }) => {
                  const monthLabel = new Intl.DateTimeFormat("en", { month: "short" })
                    .format(new Date(`${month}-01T00:00:00Z`));
                  return (
                    <div key={month} className="flex min-w-0 flex-col items-center">
                      <div className="flex h-36 w-full items-end justify-center gap-1 border-b border-slate-100 pb-1">
                        <div
                          className="w-3 rounded-t bg-rose-500 sm:w-5"
                          style={{ height: requests ? `${Math.max(4, (requests / monthlyPeak) * 100)}%` : "0%" }}
                          title={`${requests} requests`}
                        />
                        <div
                          className="w-3 rounded-t bg-emerald-500 sm:w-5"
                          style={{ height: completed ? `${Math.max(4, (completed / monthlyPeak) * 100)}%` : "0%" }}
                          title={`${completed} completed`}
                        />
                      </div>
                      <span className="mt-2 text-xs font-medium text-slate-500">{monthLabel}</span>
                      <span className="mt-1 text-[10px] text-slate-400">{requests} / {completed}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Created</span>
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Completed</span>
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Your account</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Profile overview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep your contact details and donor information up to date so your LifeDrop profile stays useful to the community.
          </p>
          <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
            <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span className="text-slate-500">Blood group</span>
              <span className="font-semibold text-slate-800">{user.bloodGroup || "Not provided"}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span className="text-slate-500">Location</span>
              <span className="font-semibold text-slate-800">
                {[user.upazila, user.district].filter(Boolean).join(", ") || "Not provided"}
              </span>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-rose-100 bg-rose-50/70 p-6 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <Heart size={21} />
          </span>
          <h2 className="mt-5 text-lg font-bold text-slate-900">Every connection matters</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            LifeDrop helps people find support through a caring donor community. Your profile is the first step to staying connected.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default function DashboardLayout() {
  const { user, logout, getUnreadNotificationCount } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = () => {
      getUnreadNotificationCount()
        .then(({ unreadCount }) => {
          if (!active) return;
          setUnreadNotifications(unreadCount);
          setNotificationError("");
        })
        .catch((error) => {
          if (active) setNotificationError(error.message);
        });
    };
    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [getUnreadNotificationCount]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out of LifeDrop?",
      text: "You can sign in again at any time.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      cancelButtonText: "Stay signed in",
      confirmButtonColor: "#e11d48",
    });
    if (!result.isConfirmed) return;

    logout();
    setMobileSidebarOpen(false);
    await Swal.fire({
      title: "You are signed out",
      icon: "success",
      timer: 1300,
      showConfirmButton: false,
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 hidden h-screen flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <Menu size={21} />
            <span className="text-sm font-semibold">Menu</span>
          </button>
          <div className="hidden text-sm font-semibold text-slate-600 lg:block">
            LifeDrop dashboard
          </div>
          <Link to="/" className="text-sm font-semibold text-rose-700 hover:text-rose-800 lg:hidden">
            LifeDrop
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/notifications"
              aria-label={notificationError
                ? `Notifications unavailable: ${notificationError}`
                : `Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
              title={notificationError || "Notifications"}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <Bell size={19} />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <div className="hidden sm:block">
              <UserIdentity user={user} compact />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Outlet context={{ user }} />
        </main>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            aria-label="Close dashboard navigation"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl">
            <div className="flex justify-end border-b border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close dashboard navigation"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent
              user={user}
              onNavigate={() => setMobileSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

export function DashboardHomeRoute() {
  const { user } = useAuth();
  return <DashboardHome user={user} />;
}

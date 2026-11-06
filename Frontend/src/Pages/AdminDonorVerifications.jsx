import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Eye, RefreshCw, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

export default function AdminDonorVerifications() {
  const {
    getAdminDonorVerifications,
    getAdminDonorCertificate,
    reviewAdminDonorVerification,
  } = useAuth();
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminDonorVerifications();
      setApplications(result.applications);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [getAdminDonorVerifications]);

  useEffect(() => {
    let active = true;
    getAdminDonorVerifications()
      .then((result) => {
        if (active) setApplications(result.applications);
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
  }, [getAdminDonorVerifications]);

  useEffect(() => () => {
    if (documentUrl.startsWith("blob:")) URL.revokeObjectURL(documentUrl);
  }, [documentUrl]);

  const openDocument = async (applicationId) => {
    setBusy(true);
    setError("");
    setSelectedId("");
    setDocumentUrl("");
    try {
      const file = await getAdminDonorCertificate(applicationId);
      setSelectedId(applicationId);
      setDocumentUrl(URL.createObjectURL(file));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  };

  const review = async (application, status) => {
    const result = await Swal.fire({
      title: status === "verified" ? "Approve donor verification?" : "Reject donor verification?",
      text: status === "verified"
        ? "Confirm that the certificate matches the applicant and that the applicant is at least 18. The uploaded document and date of birth will be removed from the active account record after this decision."
        : "The uploaded document and date of birth will be removed from the active account record. The applicant can submit a new certificate from their profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: status === "verified" ? "Approve and delete document" : "Reject and delete document",
      cancelButtonText: "Cancel",
      confirmButtonColor: status === "verified" ? "#059669" : "#e11d48",
    });
    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await reviewAdminDonorVerification(application.id, status);
      setApplications((current) => current.filter((entry) => entry.id !== application.id));
      setSelectedId("");
      setDocumentUrl("");
      await Swal.fire({
        title: status === "verified" ? "Donor verified" : "Verification rejected",
        text: "The private document and date of birth have been removed from the active account record.",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (reviewError) {
      await Swal.fire({
        title: "Unable to complete review",
        text: reviewError.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setBusy(false);
    }
  };

  const selectedApplication = applications.find((application) => application.id === selectedId);

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">Administrator tools</p>
          <h1 className="mt-2 text-3xl font-extrabold">Donor verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Review certificates privately. Check the name and date of birth, and approve only applicants who meet the 18+ requirement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" role="status">Loading applications…</p>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <BadgeCheck className="text-emerald-700" size={24} />
              <p className="mt-3 font-bold text-emerald-900">No pending applications</p>
              <p className="mt-1 text-sm text-emerald-800">New donor verification requests will appear here.</p>
            </div>
          ) : applications.map((application) => (
            <article key={application.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${selectedId === application.id ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                {application.avatar ? (
                  <img src={application.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 font-bold text-rose-700">
                    {application.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-slate-900">{application.name}</h2>
                  <p className="break-all text-sm text-slate-600">{application.email}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {application.bloodGroup} · {application.upazila}, {application.district}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {new Date(application.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void openDocument(application.id)}
                disabled={busy}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Eye size={16} />
                View private certificate
              </button>
            </article>
          ))}
        </div>

        <div className="min-h-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {selectedApplication && documentUrl ? (
            <>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-rose-600" size={20} />
                <div>
                  <h2 className="font-bold text-slate-900">Private certificate review</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Compare the certificate name with {selectedApplication.name}'s account and verify the date of birth is at least 18 years ago. The date of birth is not retained after the decision.
                  </p>
                </div>
              </div>
              <img
                src={documentUrl}
                alt="Birth certificate submitted for private administrator review"
                className="mt-5 max-h-[34rem] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void review(selectedApplication, "verified")}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void review(selectedApplication, "rejected")}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <ShieldCheck className="text-slate-300" size={32} />
              <p className="mt-3 font-semibold text-slate-700">Select an application to review</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Certificate images are only available to authenticated administrators and are not cached by the server.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

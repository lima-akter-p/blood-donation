import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";
import geography from "../data/bangladeshGeography.json";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";
const editableFields = [
  "recipientName",
  "recipientDistrict",
  "recipientUpazila",
  "hospitalName",
  "fullAddress",
  "bloodGroup",
  "donationDate",
  "donationTime",
  "requestMessage",
];
const districts = [...geography.districts].sort((first, second) =>
  first.name.localeCompare(second.name),
);

function FieldError({ error }) {
  return error ? <p className="mt-2 text-sm text-red-600" role="alert">{error.message}</p> : null;
}

export default function CreateDonationRequest() {
  const {
    user,
    createDonationRequest,
    getDonationRequest,
    getAdminDonationRequest,
    updateDonationRequest,
  } = useAuth();
  const navigate = useNavigate();
  const { requestId } = useParams();
  const requestListPath = user.role === "volunteer"
    ? "/dashboard/manage-donation-requests"
    : "/dashboard/my-donation-requests";
  const [loading, setLoading] = useState(Boolean(requestId));
  const [loadError, setLoadError] = useState("");
  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  useEffect(() => {
    if (!requestId) return undefined;
    let active = true;
    const loadRequest = async () => {
      try {
        const { request } = user.role === "admin"
          ? await getAdminDonationRequest(requestId)
          : await getDonationRequest(requestId);
        if (active) reset(request);
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRequest();
    return () => {
      active = false;
    };
  }, [getAdminDonationRequest, getDonationRequest, requestId, reset, user.role]);

  const recipientDistrict = useWatch({ control, name: "recipientDistrict" });
  const recipientDistrictId = useMemo(
    () => districts.find((district) => district.name === recipientDistrict)?.id,
    [recipientDistrict],
  );
  const upazilas = recipientDistrictId
    ? geography.upazilas
      .filter((upazila) => upazila.districtId === recipientDistrictId)
      .map((upazila) => upazila.name)
      .sort((first, second) => first.localeCompare(second))
    : [];

  const onSubmit = async (details) => {
    try {
      const editableDetails = Object.fromEntries(
        editableFields.map((field) => [field, details[field]]),
      );
      if (requestId) {
        await updateDonationRequest(requestId, editableDetails);
      } else {
        await createDonationRequest(editableDetails);
      }
      await Swal.fire({
        title: requestId ? "Donation request updated" : "Donation request created",
        text: requestId
          ? "Your request details have been saved."
          : "Your request is now pending and visible to the community.",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
      navigate(requestListPath);
    } catch (error) {
      await Swal.fire({
        title: requestId ? "Unable to update request" : "Unable to create request",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500" role="status">
        Loading donation request…
      </div>
    );
  }

  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Unable to load donation request</h1>
        <p className="mt-3 text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => navigate(requestListPath)}
          className="mt-6 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white"
        >
          Return to my requests
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <button
        type="button"
        onClick={() => navigate(requestListPath)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-rose-700"
      >
        <ArrowLeft size={17} />
        My donation requests
      </button>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
        {requestId ? "Update request details" : "Help someone find a donor"}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {requestId ? "Edit donation request" : "Create a donation request"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Share accurate details so a nearby donor can respond.
      </p>

      <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="requester-name">Requester name</label>
          <input id="requester-name" value={user.name} readOnly className={`${inputClass} bg-slate-50`} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="requester-email">Requester email</label>
          <input id="requester-email" type="email" value={user.email} readOnly className={`${inputClass} bg-slate-50`} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="recipient-name">Recipient name</label>
          <input
            id="recipient-name"
            autoComplete="name"
            className={inputClass}
            aria-invalid={Boolean(errors.recipientName)}
            {...register("recipientName", {
              required: "Recipient name is required.",
              minLength: { value: 2, message: "Name must be at least 2 characters." },
              maxLength: { value: 80, message: "Name cannot exceed 80 characters." },
            })}
          />
          <FieldError error={errors.recipientName} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="request-blood-group">Blood group</label>
          <select
            id="request-blood-group"
            defaultValue=""
            className={inputClass}
            aria-invalid={Boolean(errors.bloodGroup)}
            {...register("bloodGroup", { required: "Select the required blood group." })}
          >
            <option value="" disabled>Select blood group</option>
            {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
          <FieldError error={errors.bloodGroup} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="recipient-district">Recipient district</label>
          {(() => {
            const districtField = register("recipientDistrict", { required: "Select a district." });
            return (
              <select
                id="recipient-district"
                defaultValue=""
                className={inputClass}
                aria-invalid={Boolean(errors.recipientDistrict)}
                {...districtField}
                onChange={(event) => {
                  districtField.onChange(event);
                  setValue("recipientUpazila", "", { shouldValidate: true });
                }}
              >
                <option value="" disabled>Select district</option>
                {districts.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}
              </select>
            );
          })()}
          <FieldError error={errors.recipientDistrict} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="recipient-upazila">Recipient upazila / thana</label>
          <select
            id="recipient-upazila"
            defaultValue=""
            disabled={!recipientDistrict}
            className={inputClass}
            aria-invalid={Boolean(errors.recipientUpazila)}
            {...register("recipientUpazila", { required: "Select an upazila or thana." })}
          >
            <option value="" disabled>{recipientDistrict ? "Select upazila or thana" : "Choose a district first"}</option>
            {upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
          </select>
          <FieldError error={errors.recipientUpazila} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="hospital-name">Hospital name</label>
          <input
            id="hospital-name"
            className={inputClass}
            aria-invalid={Boolean(errors.hospitalName)}
            {...register("hospitalName", {
              required: "Hospital name is required.",
              minLength: { value: 2, message: "Hospital name must be at least 2 characters." },
              maxLength: { value: 160, message: "Hospital name cannot exceed 160 characters." },
            })}
          />
          <FieldError error={errors.hospitalName} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donation-date">Donation date</label>
          <input
            id="donation-date"
            type="date"
            className={inputClass}
            aria-invalid={Boolean(errors.donationDate)}
            {...register("donationDate", {
              required: "Donation date is required.",
              validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || "Enter a valid donation date.",
            })}
          />
          <FieldError error={errors.donationDate} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donation-time">Donation time</label>
          <input
            id="donation-time"
            type="time"
            className={inputClass}
            aria-invalid={Boolean(errors.donationTime)}
            {...register("donationTime", { required: "Donation time is required." })}
          />
          <FieldError error={errors.donationTime} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="full-address">Full address</label>
          <input
            id="full-address"
            autoComplete="street-address"
            className={inputClass}
            aria-invalid={Boolean(errors.fullAddress)}
            {...register("fullAddress", {
              required: "Full address is required.",
              minLength: { value: 2, message: "Address must be at least 2 characters." },
              maxLength: { value: 240, message: "Address cannot exceed 240 characters." },
            })}
          />
          <FieldError error={errors.fullAddress} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="request-message">Why is blood needed?</label>
          <textarea
            id="request-message"
            rows={4}
            className={inputClass}
            aria-invalid={Boolean(errors.requestMessage)}
            {...register("requestMessage", {
              required: "Please describe the request.",
              minLength: { value: 2, message: "Message must be at least 2 characters." },
              maxLength: { value: 1000, message: "Message cannot exceed 1000 characters." },
            })}
          />
          <FieldError error={errors.requestMessage} />
        </div>
        <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
          Your request will be created with pending status. Status is managed separately and cannot be selected here.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
        >
          {isSubmitting
            ? requestId ? "Saving changes..." : "Submitting request..."
            : requestId ? "Update donation request" : "Submit donation request"}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>
    </section>
  );
}

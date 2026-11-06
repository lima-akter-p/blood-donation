import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";
import geography from "../data/bangladeshGeography.json";
import { uploadAvatar } from "../services/authApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100 disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100";
const districts = [...geography.districts].sort((first, second) =>
  first.name.localeCompare(second.name),
);

function getProfileValues(user) {
  return {
    name: user.name || "",
    bloodGroup: user.bloodGroup || "",
    district: user.district || "",
    upazila: user.upazila || "",
    phone: user.phone || "",
    isAvailable: user.isAvailable !== false,
    nextAvailableDate: user.nextAvailableDate || "",
  };
}

function FieldError({ error }) {
  return error ? <p className="mt-2 text-sm text-red-600" role="alert">{error.message}</p> : null;
}

export default function DashboardProfile() {
  const { user, updateProfile, resubmitDonorVerification } = useAuth();
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const {
    control,
    register,
    setValue,
    getValues,
    trigger,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: getProfileValues(user), mode: "onBlur" });

  const selectedDistrict = useWatch({ control, name: "district" });
  const isDonor = user.role?.trim().toLowerCase() === "donor";
  const donorVerificationStatus = user.donorVerificationStatus || "verified";
  const selectedDistrictId = districts.find(
    (district) => district.name === selectedDistrict,
  )?.id;
  const upazilas = selectedDistrictId
    ? geography.upazilas
      .filter((upazila) => upazila.districtId === selectedDistrictId)
      .map((upazila) => upazila.name)
      .sort((first, second) => first.localeCompare(second))
    : [];

  useEffect(() => {
    reset(getProfileValues(user));
  }, [reset, user]);

  useEffect(() => () => {
    if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const beginEditing = () => {
    reset(getProfileValues(user));
    setAvatarPreview(user.avatar || "");
    setEditing(true);
  };

  const cancelEditing = () => {
    reset(getProfileValues(user));
    setAvatarPreview(user.avatar || "");
    setEditing(false);
  };

  const onSubmit = async (values) => {
    try {
      const selectedAvatar = values.avatarFile;
      const profile = { ...values };
      delete profile.avatarFile;
      delete profile.verificationDateOfBirth;
      delete profile.verificationCertificate;
      delete profile.verificationConsent;
      const { phone, isAvailable, nextAvailableDate } = profile;
      delete profile.phone;
      delete profile.isAvailable;
      delete profile.nextAvailableDate;
      if (isDonor) {
        profile.phone = phone;
        profile.isAvailable = isAvailable;
        profile.nextAvailableDate = nextAvailableDate;
      }
      Swal.fire({
        title: selectedAvatar?.[0] ? "Uploading your profile photo" : "Saving your profile",
        text: "Please wait while we update your account.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      if (selectedAvatar?.[0]) {
        profile.avatar = await uploadAvatar(selectedAvatar[0]);
        Swal.update({ title: "Saving your profile" });
      }

      const savedUser = await updateProfile(profile);
      Swal.close();
      reset(getProfileValues(savedUser));
      setAvatarPreview(savedUser.avatar || "");
      setEditing(false);
      await Swal.fire({
        title: "Profile updated",
        text: "Your LifeDrop profile has been saved.",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Unable to update your profile",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  const submitVerification = async () => {
    if (submittingVerification) return;
    const valid = await trigger([
      "verificationDateOfBirth",
      "verificationCertificate",
      "verificationConsent",
    ]);
    if (!valid) return;

    const values = getValues();
    setSubmittingVerification(true);
    try {
      Swal.fire({
        title: "Submitting verification",
        text: "Please wait while we securely submit your certificate.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
      await resubmitDonorVerification({
        dateOfBirth: values.verificationDateOfBirth,
        birthCertificate: values.verificationCertificate[0],
        documentConsent: values.verificationConsent,
      });
      Swal.close();
      await Swal.fire({
        title: "Verification resubmitted",
        text: "Your certificate is pending private administrator review.",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (error) {
      Swal.close();
      await Swal.fire({
        title: "Unable to submit verification",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Account settings</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Your profile</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep your donor information current so your community can rely on it.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={beginEditing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
          >
            <Pencil size={16} />
            Edit profile
          </button>
        )}
      </div>

      {isDonor && donorVerificationStatus !== "verified" && (
        <aside className={`mt-7 rounded-2xl border p-5 ${
          donorVerificationStatus === "rejected"
            ? "border-amber-200 bg-amber-50"
            : "border-sky-200 bg-sky-50"
        }`} aria-live="polite">
          <h2 className="font-bold text-slate-900">
            {donorVerificationStatus === "rejected" ? "Verification needs another submission" : "Donor verification pending"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {donorVerificationStatus === "rejected"
              ? "Your last document was not approved. Submit a clear birth certificate photo and your date of birth again. Donor features remain unavailable until approval."
              : "Your certificate is stored privately and is waiting for administrator review. You can use your profile while waiting; donor features become available after approval."}
          </p>
          {donorVerificationStatus === "rejected" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="verification-date-of-birth">Date of birth (18+)</label>
                <input
                  id="verification-date-of-birth"
                  type="date"
                  className={inputClass}
                  aria-invalid={Boolean(errors.verificationDateOfBirth)}
                  {...register("verificationDateOfBirth", {
                    required: "Date of birth is required.",
                    validate: (value) => {
                      const birthday = new Date(`${value}T00:00:00`);
                      const cutoff = new Date();
                      cutoff.setHours(0, 0, 0, 0);
                      cutoff.setFullYear(cutoff.getFullYear() - 18);
                      return (!Number.isNaN(birthday.getTime()) && birthday <= cutoff)
                        || "You must be at least 18 years old.";
                    },
                  })}
                />
                <FieldError error={errors.verificationDateOfBirth} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="verification-certificate">Birth certificate (PNG/JPEG/WebP, up to 5 MB)</label>
                <input
                  id="verification-certificate"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-rose-700"
                  aria-invalid={Boolean(errors.verificationCertificate)}
                  {...register("verificationCertificate", {
                    required: "A certificate image is required.",
                    validate: (files) => {
                      const file = files?.[0];
                      if (!file) return "A certificate image is required.";
                      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                        return "Choose a PNG, JPEG, or WebP image.";
                      }
                      return file.size <= 5 * 1024 * 1024 || "Image must be no larger than 5 MB.";
                    },
                  })}
                />
                <FieldError error={errors.verificationCertificate} />
              </div>
              <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  aria-invalid={Boolean(errors.verificationConsent)}
                  {...register("verificationConsent", { required: "Consent is required." })}
                />
                <span>I consent to private storage of this certificate for administrator review and understand it is removed from my active account record after the decision. Database backup retention may apply.</span>
              </label>
              <FieldError error={errors.verificationConsent} />
              <button
                type="button"
                onClick={() => void submitVerification()}
                disabled={submittingVerification}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                Submit certificate for review
              </button>
            </div>
          )}
        </aside>
      )}

      <form className="mt-8" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-7 flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={`${user.name}'s profile`}
              className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
              onError={() => setAvatarPreview("")}
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-700">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
            {editing && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-avatar">
                  Change profile photo
                </label>
                {(() => {
                  const avatarField = register("avatarFile", {
                    validate: (files) => {
                      const file = files?.[0];
                      if (!file) return true;
                      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                        return "Choose a PNG, JPEG, or WebP image.";
                      }
                      return file.size <= 5 * 1024 * 1024 || "Image must be no larger than 5 MB.";
                    },
                  });
                  return (
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="min-w-0 max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-rose-700 hover:file:bg-rose-100"
                      aria-invalid={Boolean(errors.avatarFile)}
                      {...avatarField}
                      onChange={(event) => {
                        avatarField.onChange(event);
                        const file = event.target.files?.[0];
                        setAvatarPreview(file ? URL.createObjectURL(file) : user.avatar || "");
                      }}
                    />
                  );
                })()}
                <FieldError error={errors.avatarFile} />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              autoComplete="name"
              readOnly={!editing}
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                required: "Name is required.",
                minLength: { value: 2, message: "Name must be at least 2 characters." },
                maxLength: { value: 80, message: "Name cannot exceed 80 characters." },
              })}
            />
            <FieldError error={errors.name} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-email">Email address</label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              className={`${inputClass} cursor-not-allowed`}
              aria-describedby="profile-email-note"
            />
            <p id="profile-email-note" className="mt-2 text-xs text-slate-500">Email cannot be changed here.</p>
          </div>

          {isDonor && (
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-phone">
                Contact number
              </label>
              <input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                readOnly={!editing}
                className={inputClass}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby="profile-phone-visibility"
                {...register("phone", {
                  validate: (value) => {
                    if (!value) return true;
                    const normalized = value.replace(/[\s()-]/g, "");
                    return /^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(normalized)
                      || "Enter a valid Bangladesh mobile number.";
                  },
                })}
              />
              <FieldError error={errors.phone} />
              <p id="profile-phone-visibility" className="mt-2 text-xs leading-5 text-amber-800">
                If you add a number, it will be publicly visible to everyone in donor search. Leave it blank to keep it hidden.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-blood-group">Blood group</label>
            <select
              id="profile-blood-group"
              disabled={!editing}
              className={inputClass}
              aria-invalid={Boolean(errors.bloodGroup)}
              {...register("bloodGroup", { required: "Select your blood group." })}
            >
              <option value="" disabled>Select blood group</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <FieldError error={errors.bloodGroup} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-district">District</label>
            {(() => {
              const districtField = register("district", { required: "Select your district." });
              return (
                <select
                  id="profile-district"
                  disabled={!editing}
                  className={inputClass}
                  aria-invalid={Boolean(errors.district)}
                  {...districtField}
                  onChange={(event) => {
                    districtField.onChange(event);
                    setValue("upazila", "", { shouldValidate: true });
                  }}
                >
                  <option value="" disabled>Select district</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.name}>{district.name}</option>
                  ))}
                </select>
              );
            })()}
            <FieldError error={errors.district} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="profile-upazila">Upazila / Thana</label>
            <select
              id="profile-upazila"
              disabled={!editing || !selectedDistrict}
              className={inputClass}
              aria-invalid={Boolean(errors.upazila)}
              {...register("upazila", { required: "Select your upazila or thana." })}
            >
              <option value="" disabled>
                {selectedDistrict ? "Select upazila or thana" : "Choose a district first"}
              </option>
              {upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
            </select>
            <FieldError error={errors.upazila} />
          </div>
        </div>

        {isDonor && (
          <section className="mt-8 rounded-2xl border border-rose-100 bg-rose-50/60 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Donor availability</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tell people whether you can be contacted for a donation. Availability is self-reported and is not medical eligibility advice.
            </p>
            <label className="mt-5 flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                disabled={!editing}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 disabled:opacity-70"
                {...register("isAvailable")}
              />
              I am available to be contacted as a donor
            </label>
            <div className="mt-5 max-w-sm">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="next-available-date">
                Available again from (optional)
              </label>
              <input
                id="next-available-date"
                type="date"
                disabled={!editing}
                className={inputClass}
                aria-invalid={Boolean(errors.nextAvailableDate)}
                {...register("nextAvailableDate", {
                  validate: (value) => !value
                    || /^\d{4}-\d{2}-\d{2}$/.test(value)
                    || "Choose a valid date.",
                })}
              />
              <FieldError error={errors.nextAvailableDate} />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Donor search will include you on or after this date. Please follow qualified medical advice about donation eligibility.
              </p>
            </div>
          </section>
        )}

        {editing && (
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <X size={17} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              Save changes
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

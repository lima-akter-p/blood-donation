import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/useAuth";
import { auth } from "../../../firebase/firebase.init";
import geography from "../../../data/bangladeshGeography.json";

const Login = () => {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleIdToken, setGoogleIdToken] = useState("");
    const [googleProfile, setGoogleProfile] = useState(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onBlur" });
    const {
        control: googleControl,
        register: registerGoogleProfile,
        reset: resetGoogleProfile,
        handleSubmit: handleGoogleProfileSubmit,
        setValue: setGoogleProfileValue,
        formState: { errors: googleErrors, isSubmitting: isCompletingGoogleProfile },
    } = useForm({ mode: "onBlur" });
    const googleDistrict = useWatch({ control: googleControl, name: "district" });
    const districts = [...geography.districts].sort((first, second) =>
        first.name.localeCompare(second.name));
    const googleDistrictId = districts.find((district) => district.name === googleDistrict)?.id;
    const upazilas = googleDistrictId
        ? geography.upazilas
            .filter((upazila) => upazila.districtId === googleDistrictId)
            .map((upazila) => upazila.name)
            .sort((first, second) => first.localeCompare(second))
        : [];
    const destination = location.state?.from?.pathname || "/dashboard/profile";

    const onSubmit = async (credentials) => {
        try {
            const user = await login(credentials);
            await Swal.fire({
                title: `Welcome back, ${user.name}!`,
                text: "You are now signed in to LifeDrop.",
                icon: "success",
                confirmButtonColor: "#e11d48",
            });
            navigate(destination, { replace: true });
        } catch (error) {
            await Swal.fire({
                title: "Unable to sign in",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#e11d48",
            });
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const credential = await signInWithPopup(auth, provider);
            const idToken = await credential.user.getIdToken();
            const result = await loginWithGoogle(idToken);
            if (result.requiresProfile) {
                setGoogleIdToken(idToken);
                setGoogleProfile(result.profile);
                resetGoogleProfile({ bloodGroup: "", district: "", upazila: "" });
                return;
            }

            await Swal.fire({
                title: `Welcome to LifeDrop, ${result.user.name}!`,
                text: "You are now signed in to LifeDrop.",
                icon: "success",
                confirmButtonColor: "#e11d48",
            });
            navigate("/dashboard/profile", { replace: true });
        } catch (error) {
            if (error.code === "auth/popup-closed-by-user") return;
            await Swal.fire({
                title: "Unable to sign in with Google",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#e11d48",
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const completeGoogleProfile = async (profile) => {
        try {
            const { birthCertificate, ...details } = profile;
            const result = await loginWithGoogle(googleIdToken, details, birthCertificate?.[0]);
            if (result.requiresProfile) {
                throw new Error("Complete all profile fields before continuing.");
            }
            await Swal.fire({
                title: "Registration submitted",
                text: "Your birth certificate will be reviewed privately by an administrator. Donor features will be available after approval.",
                icon: "success",
                confirmButtonColor: "#e11d48",
            });
            navigate("/dashboard/profile", { replace: true });
        } catch (error) {
            await Swal.fire({
                title: "Unable to complete your account",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#e11d48",
            });
        }
    };

    return (
        <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
            <div className="mb-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <LockKeyhole size={23} />
                </span>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-rose-600">Welcome to LifeDrop</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Sign in to your account</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">Connect with your community and help make a difference.</p>
            </div>

            {!googleIdToken && <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="login-email">Email address</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            aria-invalid={Boolean(errors.email)}
                            className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            {...register("email", {
                                required: "Email is required.",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
                            })}
                        />
                    </div>
                    {errors.email && <p className="mt-2 text-sm text-red-600" role="alert">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="login-password">Password</label>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            aria-invalid={Boolean(errors.password)}
                            className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            {...register("password", {
                                required: "Password is required.",
                                minLength: { value: 8, message: "Password must be at least 8 characters." },
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-600" role="alert">{errors.password.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                    {!isSubmitting && <ArrowRight size={18} />}
                </button>
            </form>
            }

            {googleIdToken ? (
                <form
                    className="space-y-5"
                    onSubmit={handleGoogleProfileSubmit(completeGoogleProfile)}
                    noValidate
                >
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                        {googleProfile?.avatar && (
                            <img src={googleProfile.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{googleProfile?.name || "Google account"}</p>
                            <p className="truncate text-sm text-slate-600">{googleProfile?.email}</p>
                        </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                        Add your donor details to finish creating your LifeDrop account.
                    </p>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="google-blood-group">Blood group</label>
                        <select
                            id="google-blood-group"
                            defaultValue=""
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            aria-invalid={Boolean(googleErrors.bloodGroup)}
                            {...registerGoogleProfile("bloodGroup", { required: "Select your blood group." })}
                        >
                            <option value="" disabled>Select blood group</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                        {googleErrors.bloodGroup && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.bloodGroup.message}</p>}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="google-district">District</label>
                        <select
                            id="google-district"
                            defaultValue=""
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            aria-invalid={Boolean(googleErrors.district)}
                            {...registerGoogleProfile("district", {
                                required: "Select your district.",
                                onChange: () => setGoogleProfileValue("upazila", ""),
                            })}
                        >
                            <option value="" disabled>Select district</option>
                            {districts.map((district) => (
                                <option key={district.id} value={district.name}>{district.name}</option>
                            ))}
                        </select>
                        {googleErrors.district && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.district.message}</p>}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="google-upazila">Upazila / Thana</label>
                        <select
                            id="google-upazila"
                            defaultValue=""
                            disabled={!googleDistrict}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 disabled:bg-slate-50"
                            aria-invalid={Boolean(googleErrors.upazila)}
                            {...registerGoogleProfile("upazila", { required: "Select your upazila or thana." })}
                        >
                            <option value="" disabled>
                                {googleDistrict ? "Select upazila or thana" : "Choose a district first"}
                            </option>
                            {upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
                        </select>
                        {googleErrors.upazila && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.upazila.message}</p>}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="google-date-of-birth">
                            Date of birth <span className="font-normal text-slate-400">(18+ only)</span>
                        </label>
                        <input
                            id="google-date-of-birth"
                            type="date"
                            max={(() => {
                                const date = new Date();
                                date.setFullYear(date.getFullYear() - 18);
                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                const day = String(date.getDate()).padStart(2, "0");
                                return `${date.getFullYear()}-${month}-${day}`;
                            })()}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            aria-invalid={Boolean(googleErrors.dateOfBirth)}
                            {...registerGoogleProfile("dateOfBirth", {
                                required: "Date of birth is required.",
                                validate: (value) => {
                                    const birthday = new Date(`${value}T00:00:00`);
                                    const cutoff = new Date();
                                    cutoff.setHours(0, 0, 0, 0);
                                    cutoff.setFullYear(cutoff.getFullYear() - 18);
                                    return (!Number.isNaN(birthday.getTime()) && birthday <= cutoff)
                                        || "You must be at least 18 years old to register as a donor.";
                                },
                            })}
                        />
                        {googleErrors.dateOfBirth && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.dateOfBirth.message}</p>}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="google-birth-certificate">
                            Birth certificate photo <span className="font-normal text-rose-600">(required, up to 5 MB)</span>
                        </label>
                        <input
                            id="google-birth-certificate"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="w-full rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-rose-700"
                            aria-invalid={Boolean(googleErrors.birthCertificate)}
                            {...registerGoogleProfile("birthCertificate", {
                                required: "A birth certificate photo is required.",
                                validate: (files) => {
                                    const file = files?.[0];
                                    if (!file) return "A birth certificate photo is required.";
                                    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                                        return "Choose a PNG, JPEG, or WebP image.";
                                    }
                                    return file.size <= 5 * 1024 * 1024 || "Image must be no larger than 5 MB.";
                                },
                            })}
                        />
                        {googleErrors.birthCertificate && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.birthCertificate.message}</p>}
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                            The document is stored privately for administrator review and removed from your active account record after the decision. Database backups may retain deleted data until their configured retention period expires. It is not uploaded to a public image host.
                        </p>
                    </div>
                    <div>
                        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                            <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                aria-invalid={Boolean(googleErrors.documentConsent)}
                                {...registerGoogleProfile("documentConsent", { required: "Consent is required to submit your certificate for review." })}
                            />
                            <span>I consent to private storage of my birth certificate for administrator review and understand it is removed from my active account record after the decision. Database backup retention may apply.</span>
                        </label>
                        {googleErrors.documentConsent && <p className="mt-2 text-sm text-red-600" role="alert">{googleErrors.documentConsent.message}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isCompletingGoogleProfile}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isCompletingGoogleProfile ? "Creating your account..." : "Complete Google sign in"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setGoogleIdToken("");
                            setGoogleProfile(null);
                        }}
                        className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                </form>
            ) : (
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={() => void handleGoogleSignIn()}
                        disabled={googleLoading || isSubmitting}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span aria-hidden="true" className="text-lg font-extrabold text-[#4285F4]">G</span>
                        {googleLoading ? "Connecting to Google..." : "Continue with Google"}
                    </button>
                </div>
            )}

            {!googleIdToken && <p className="mt-7 text-center text-sm text-slate-600">
                New to LifeDrop?{" "}
                <Link to="/register" className="font-bold text-rose-600 hover:text-rose-700">Create an account</Link>
            </p>}
        </div>
    );
};

export default Login;
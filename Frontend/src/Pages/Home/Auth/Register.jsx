import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, HeartPulse } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/useAuth";
import geography from "../../../data/bangladeshGeography.json";
import { uploadAvatar } from "../../../services/authApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

const Register = () => {
    const { register: createAccount } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {
        control,
        register,
        setValue,
        getValues,
        trigger,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const districts = [...geography.districts].sort((first, second) => first.name.localeCompare(second.name));
    const selectedDistrict = useWatch({ control, name: "district" });
    const selectedDistrictId = districts.find((district) => district.name === selectedDistrict)?.id;
    const upazilas = selectedDistrictId
        ? geography.upazilas
            .filter((upazila) => upazila.districtId === selectedDistrictId)
            .map((upazila) => upazila.name)
            .sort((first, second) => first.localeCompare(second))
        : [];
    const passwordValue = useWatch({ control, name: "password" });
    const confirmPasswordValue = useWatch({ control, name: "confirmPassword" });

    useEffect(() => {
        if (confirmPasswordValue) {
            trigger("confirmPassword");
        }
    }, [passwordValue, confirmPasswordValue, trigger]);

    const onSubmit = async (details) => {
        try {
            const { avatarFile, ...account } = details;
            let avatarUploadSkipped = false;
            if (avatarFile?.[0]) {
                Swal.fire({
                    title: "Uploading your avatar",
                    text: "Please wait while we securely upload your image.",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => Swal.showLoading(),
                });
                try {
                    account.avatar = await uploadAvatar(avatarFile[0]);
                    Swal.close();
                } catch (uploadError) {
                    const choice = await Swal.fire({
                        title: "Profile photo couldn't be uploaded",
                        text: `${uploadError.message} You can still create your account without a photo and add one from your profile later.`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Create without photo",
                        cancelButtonText: "Go back",
                        confirmButtonColor: "#e11d48",
                    });
                    if (!choice.isConfirmed) return;
                    avatarUploadSkipped = true;
                }
            }
            const user = await createAccount(account);
            await Swal.fire({
                title: `Welcome to LifeDrop, ${user.name}!`,
                text: avatarUploadSkipped
                    ? "Your account is ready. You can add a profile photo later from your profile."
                    : "Your donor account is ready.",
                icon: "success",
                confirmButtonColor: "#e11d48",
            });
            navigate("/dashboard/profile", { replace: true });
        } catch (error) {
            Swal.close();
            await Swal.fire({
                title: "Unable to create your account",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#e11d48",
            });
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
            <div className="mb-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <HeartPulse size={24} />
                </span>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-rose-600">Join the community</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Create your donor account</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">Register to connect with people who need your help.</p>
            </div>

            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-name">Full name</label>
                    <input
                        id="register-name"
                        autoComplete="name"
                        className={inputClass}
                        placeholder="Your name"
                        aria-invalid={Boolean(errors.name)}
                        {...register("name", {
                            required: "Name is required.",
                            minLength: { value: 2, message: "Name must be at least 2 characters." },
                            maxLength: { value: 80, message: "Name cannot exceed 80 characters." },
                        })}
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600" role="alert">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-email">Email address</label>
                    <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        className={inputClass}
                        placeholder="you@example.com"
                        aria-invalid={Boolean(errors.email)}
                        {...register("email", {
                            required: "Email is required.",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
                        })}
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600" role="alert">{errors.email.message}</p>}
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-avatar">
                        Profile photo <span className="font-normal text-slate-400">(optional, PNG/JPEG/WebP up to 5 MB)</span>
                    </label>
                    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center">
                        <input
                            id="register-avatar"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="min-w-0 flex-1 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2.5 file:font-semibold file:text-rose-700 hover:file:bg-rose-100"
                            aria-invalid={Boolean(errors.avatarFile)}
                            {...register("avatarFile", {
                                validate: (files) => {
                                    const file = files?.[0];
                                    if (!file) return true;
                                    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                                        return "Choose a PNG, JPEG, or WebP image.";
                                    }
                                    return file.size <= 5 * 1024 * 1024 || "Image must be no larger than 5 MB.";
                                },
                            })}
                        />
                    </div>
                    {errors.avatarFile && <p className="mt-2 text-sm text-red-600" role="alert">{errors.avatarFile.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-blood-group">Blood group</label>
                    <select
                        id="register-blood-group"
                        className={inputClass}
                        defaultValue=""
                        aria-invalid={Boolean(errors.bloodGroup)}
                        {...register("bloodGroup", { required: "Select your blood group." })}
                    >
                        <option value="" disabled>Select blood group</option>
                        {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                    </select>
                    {errors.bloodGroup && <p className="mt-2 text-sm text-red-600" role="alert">{errors.bloodGroup.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-district">District</label>
                    {(() => {
                        const districtField = register("district", { required: "Select your district." });
                        return (
                            <select
                                id="register-district"
                                className={inputClass}
                                defaultValue=""
                                aria-invalid={Boolean(errors.district)}
                                {...districtField}
                                onChange={(event) => {
                                    districtField.onChange(event);
                                    setValue("upazila", "", { shouldValidate: true });
                                }}
                            >
                                <option value="" disabled>Select district</option>
                                {districts.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}
                            </select>
                        );
                    })()}
                    {errors.district && <p className="mt-2 text-sm text-red-600" role="alert">{errors.district.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-upazila">Upazila / Thana</label>
                    <select
                        id="register-upazila"
                        className={inputClass}
                        defaultValue=""
                        disabled={!selectedDistrict}
                        aria-invalid={Boolean(errors.upazila)}
                        {...register("upazila", { required: "Select your upazila or thana." })}
                    >
                        <option value="" disabled>{selectedDistrict ? "Select upazila or thana" : "Choose a district first"}</option>
                        {upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
                    </select>
                    {errors.upazila && <p className="mt-2 text-sm text-red-600" role="alert">{errors.upazila.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-password">Password</label>
                    <div className="relative">
                        <input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                            placeholder="Create a strong password"
                            aria-invalid={Boolean(errors.password)}
                            {...register("password", {
                                required: "Password is required.",
                                minLength: { value: 8, message: "Password must be at least 8 characters." },
                                validate: {
                                    complexity: (value) => (
                                        /[a-z]/.test(value)
                                        && /[A-Z]/.test(value)
                                        && /\d/.test(value)
                                        && /[^A-Za-z0-9]/.test(value)
                                    ) || "Use uppercase and lowercase letters, a number, and a special character.",
                                    maxBytes: (value) => new TextEncoder().encode(value).length <= 72
                                        || "Password must be no more than 72 bytes.",
                                },
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character.
                    </p>
                    {errors.password && <p className="mt-2 text-sm text-red-600" role="alert">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="register-confirm-password">Confirm password</label>
                    <div className="relative">
                        <input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                            placeholder="Repeat your password"
                            aria-invalid={Boolean(errors.confirmPassword)}
                            {...register("confirmPassword", {
                                required: "Confirm your password.",
                                validate: (value) => value === getValues("password") || "Passwords do not match.",
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((visible) => !visible)}
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            aria-pressed={showConfirmPassword}
                        >
                            {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-2 text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                >
                    {isSubmitting ? "Creating account..." : "Create donor account"}
                    {!isSubmitting && <ArrowRight size={18} />}
                </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-rose-600 hover:text-rose-700">Sign in</Link>
            </p>
        </div>
    );
};

export default Register;

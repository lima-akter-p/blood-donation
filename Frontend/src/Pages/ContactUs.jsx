import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

function FieldError({ error }) {
  return error ? <p className="mt-1.5 text-sm text-red-600" role="alert">{error.message}</p> : null;
}

export default function ContactUs({ standalone = false }) {
  const { user, submitContactMessage } = useAuth();
  const configuredPhone = import.meta.env.VITE_CONTACT_PHONE?.trim();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: user?.name || "", email: user?.email || "", phone: "", subject: "", message: "" },
    mode: "onBlur",
  });

  const onSubmit = async (details) => {
    try {
      await submitContactMessage(details);
      reset({ name: user?.name || "", email: user?.email || "", phone: "", subject: "", message: "" });
      await Swal.fire({
        title: "Message received",
        text: "Thanks for contacting LifeDrop. Our team will get back to you.",
        icon: "success",
        confirmButtonColor: "#e11d48",
      });
    } catch (error) {
      await Swal.fire({
        title: "Unable to send your message",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  return (
    <section
      id="contact"
      className={`bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 ${standalone ? "min-h-[65vh] sm:py-20" : ""}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">We’re here to help</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Contact LifeDrop
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Questions, feedback, or need help? Send our team a message and we’ll follow up.
          </p>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
            <h2 className="text-xl font-bold">Get in touch</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Reach out to the LifeDrop team. We aim to respond as soon as possible.
            </p>
            <div className="mt-7 space-y-5 text-sm">
              <p className="flex items-start gap-3">
                <MapPin size={19} className="mt-0.5 shrink-0 text-rose-300" />
                <span>Dhaka, Bangladesh</span>
              </p>
              <p className="flex items-start gap-3">
                <Mail size={19} className="mt-0.5 shrink-0 text-rose-300" />
                <span>Send us a message using the contact form.</span>
              </p>
              <p className="flex items-start gap-3">
                <Phone size={19} className="mt-0.5 shrink-0 text-rose-300" />
                {configuredPhone
                  ? <a className="hover:text-rose-200" href={`tel:${configuredPhone}`}>{configuredPhone}</a>
                  : <span>Phone support details will be available soon.</span>}
              </p>
            </div>
            {standalone && (
              <Link to="/" className="mt-8 inline-flex text-sm font-semibold text-rose-200 hover:text-white">
                Return to LifeDrop home
              </Link>
            )}
          </aside>

          <form
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-slate-700">Your name</label>
                <input
                  id="contact-name"
                  autoComplete="name"
                  className={inputClass}
                  aria-invalid={Boolean(errors.name)}
                  {...register("name", {
                    required: "Enter your name.",
                    minLength: { value: 2, message: "Name must be at least 2 characters." },
                    maxLength: { value: 80, message: "Name must be no more than 80 characters." },
                  })}
                />
                <FieldError error={errors.name} />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  aria-invalid={Boolean(errors.email)}
                  {...register("email", {
                    required: "Enter your email address.",
                    maxLength: { value: 254, message: "Email must be no more than 254 characters." },
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
                  })}
                />
                <FieldError error={errors.email} />
              </div>
              <div>
                <label htmlFor="contact-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone number <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClass}
                  aria-invalid={Boolean(errors.phone)}
                  {...register("phone", {
                    maxLength: { value: 24, message: "Phone number must be no more than 24 characters." },
                    pattern: { value: /^\+?[0-9\s()-]{7,24}$/, message: "Enter a valid phone number." },
                  })}
                />
                <FieldError error={errors.phone} />
              </div>
              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                <input
                  id="contact-subject"
                  className={inputClass}
                  aria-invalid={Boolean(errors.subject)}
                  {...register("subject", {
                    required: "Enter a subject.",
                    minLength: { value: 3, message: "Subject must be at least 3 characters." },
                    maxLength: { value: 120, message: "Subject must be no more than 120 characters." },
                  })}
                />
                <FieldError error={errors.subject} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  className={`${inputClass} resize-y`}
                  aria-invalid={Boolean(errors.message)}
                  {...register("message", {
                    required: "Enter your message.",
                    minLength: { value: 10, message: "Message must be at least 10 characters." },
                    maxLength: { value: 2000, message: "Message must be no more than 2000 characters." },
                  })}
                />
                <FieldError error={errors.message} />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <Send size={17} />
              {isSubmitting ? "Sending message…" : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

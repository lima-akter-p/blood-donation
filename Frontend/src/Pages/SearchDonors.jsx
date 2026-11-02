import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Phone, Search, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import Swal from "sweetalert2";
import geography from "../data/bangladeshGeography.json";
import { searchDonors } from "../services/donationRequestApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";
const districts = [...geography.districts].sort((first, second) =>
  first.name.localeCompare(second.name),
);

function DonorCard({ donor }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        {donor.avatar ? (
          <img
            src={donor.avatar}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-rose-50"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <UserRound size={25} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-slate-900">{donor.name}</h2>
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Available for contact
          </span>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={15} className="shrink-0 text-rose-500" />
            {donor.upazila}, {donor.district}
          </p>
          {donor.phone && (
            <a
              href={`tel:${donor.phone}`}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <Phone size={15} />
              {donor.phone}
              <span className="sr-only">Call donor</span>
            </a>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-extrabold text-rose-700">
          {donor.bloodGroup}
        </span>
      </div>
    </article>
  );
}

export default function SearchDonors() {
  const [donors, setDonors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [search, setSearch] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { bloodGroup: "", district: "", upazila: "" }, mode: "onSubmit" });
  const selectedDistrict = useWatch({ control, name: "district" });
  const districtId = useMemo(
    () => districts.find((district) => district.name === selectedDistrict)?.id,
    [selectedDistrict],
  );
  const upazilas = districtId
    ? geography.upazilas
      .filter((upazila) => upazila.districtId === districtId)
      .map((upazila) => upazila.name)
      .sort((first, second) => first.localeCompare(second))
    : [];

  const loadDonors = async (filters, requestedPage) => {
    setLoading(true);
    try {
      const result = await searchDonors({ ...filters, page: requestedPage });
      setDonors(result.donors);
      setPagination(result.pagination);
      setSearch(filters);
      setPage(requestedPage);
    } catch (error) {
      await Swal.fire({
        title: "Unable to search donors",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (values) => {
    await loadDonors(values, 1);
  };

  const onReset = () => {
    reset();
    setDonors([]);
    setSearch(null);
    setPage(1);
    setPagination({ page: 1, total: 0, totalPages: 0 });
  };

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Find a donor</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Search blood donors</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Find active donors who have marked themselves available for contact in your selected location.
          </p>
        </header>

        <form
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]"
          onSubmit={handleSubmit(onSearch)}
          noValidate
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donor-blood-group">Blood group</label>
            <select
              id="donor-blood-group"
              className={inputClass}
              aria-invalid={Boolean(errors.bloodGroup)}
              {...register("bloodGroup", { required: "Select a blood group." })}
            >
              <option value="">Select blood group</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            {errors.bloodGroup && <p className="mt-1 text-xs text-red-600" role="alert">{errors.bloodGroup.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donor-district">District</label>
            <select
              id="donor-district"
              className={inputClass}
              aria-invalid={Boolean(errors.district)}
              {...register("district", {
                required: "Select a district.",
                onChange: () => setValue("upazila", ""),
              })}
            >
              <option value="">Select district</option>
              {districts.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}
            </select>
            {errors.district && <p className="mt-1 text-xs text-red-600" role="alert">{errors.district.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="donor-upazila">Upazila / Thana</label>
            <select
              id="donor-upazila"
              className={inputClass}
              disabled={!districtId}
              aria-invalid={Boolean(errors.upazila)}
              {...register("upazila", { required: "Select an upazila or thana." })}
            >
              <option value="">Select upazila or thana</option>
              {upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
            </select>
            {errors.upazila && <p className="mt-1 text-xs text-red-600" role="alert">{errors.upazila.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={17} /> {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="self-end rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Clear
          </button>
        </form>

        {search && (
          <section className="mt-8" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Matching donors</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {search.bloodGroup} donors in {search.upazila}, {search.district}
                </p>
              </div>
              <p className="text-sm text-slate-500">
                {pagination.total} {pagination.total === 1 ? "donor" : "donors"} found
              </p>
            </div>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500" role="status">
                Searching active donors…
              </div>
            ) : donors.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                <p className="text-lg font-bold text-slate-900">No donors found</p>
                <p className="mt-2 text-sm text-slate-600">Try another blood group or nearby location.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {donors.map((donor) => <DonorCard key={donor.id} donor={donor} />)}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-between" aria-label="Donor result pages">
                <button
                  type="button"
                  onClick={() => void loadDonors(search, page - 1)}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={17} /> Previous
                </button>
                <span className="text-sm text-slate-600">Page {page} of {pagination.totalPages}</span>
                <button
                  type="button"
                  onClick={() => void loadDonors(search, page + 1)}
                  disabled={page >= pagination.totalPages || loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight size={17} />
                </button>
              </nav>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

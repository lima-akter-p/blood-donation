import { ArrowRight, CalendarDays, Clock3, HeartPulse } from "lucide-react";
import { Link } from "react-router";
import { blogPosts } from "../data/blogPosts";

export default function BlogPosts() {
  return (
    <main className="min-h-[65vh] bg-[#f8f8fa] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-600">
            <HeartPulse size={17} />
            LifeDrop Journal
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Blood Donation Articles
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Read practical guides and community stories about blood donation,
            donor preparation, and safety.
          </p>
        </header>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="All articles">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl"
            >
              <Link
                to={`/blog/${post.slug}`}
                aria-label={`Read ${post.title}`}
                className="relative block h-56 overflow-hidden bg-rose-50"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-rose-600">
                  {post.category}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />{post.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />{post.readTime}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold leading-snug text-slate-900 group-hover:text-rose-600">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{post.description}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-rose-600 hover:gap-3"
                >
                  Read Article <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}


import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  CalendarDays,
  HeartPulse,
} from "lucide-react";
import { blogPosts } from "../data/blogPosts";

export default function BlogPosts() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % blogPosts.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + blogPosts.length) % blogPosts.length
    );
  };

  // Responsive card count is handled by CSS.
  // Each slide shows the next three posts on desktop,
  // two on tablet, and one on mobile.
  const visiblePosts = [0, 1, 2].map(
    (offset) => blogPosts[(currentIndex + offset) % blogPosts.length]
  );

  return (
    <section className="overflow-hidden bg-[#f8f8fa] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-600">
              <HeartPulse size={17} />
              LifeDrop Journal
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Stories, Tips &{" "}
              <span className="text-rose-600">Awareness</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore helpful articles about blood donation, donor
              safety, and the people making a difference in their
              communities.
            </p>
          </div>

          {/* Carousel controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous blog posts"
              className="  flex h-12 w-12 items-center justify-center rounded-full cursor-pointer border  border-rose-600 bg-rose-600 text-white transition-all duration-300 hover:border-slate-900 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next blog posts"
              className="flex h-12 w-12 items-center justify-center rounded-full cursor-pointer border border-rose-600 bg-rose-600 text-white transition-all duration-300 hover:border-slate-900 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Blog carousel */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl hover:shadow-slate-900/5"
            >
              {/* Image */}
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

                <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/95 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm">
                  {post.category}
                </span>
              </Link>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {post.date}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-rose-600">
                  <Link to={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                  {post.description}
                </p>

                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-6 inline-flex w-fit items-center gap-2 border-b border-transparent pb-1 text-sm font-bold text-rose-600 transition-all duration-300 hover:gap-3 hover:border-rose-600"
                >
                  Read Article
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Carousel indicators */}
        <div className="mt-9 flex items-center justify-center gap-2">
          {blogPosts.map((post, index) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Show blog set ${index + 1}`}
              aria-current={currentIndex === index ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "w-8 bg-rose-600"
                  : "w-2.5 bg-slate-300 hover:bg-rose-300"
              }`}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-slate-600">
            Want to learn more about blood donation?
          </p>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border-2 border-rose-600 px-6 py-3 text-sm font-bold text-rose-600 transition-all duration-300 hover:bg-rose-600 hover:text-white"
          >
            Explore All Articles
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

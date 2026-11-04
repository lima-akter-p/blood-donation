
import { useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
} from "lucide-react";

const blogs = [
  {
    id: 1,
    category: "Blood Donation",
    title: "Why Donating Blood Can Save Three Lives",
    description:
      "A single blood donation can help save up to three lives. Discover how your small act of kindness can make a huge difference.",
    image:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80",
    date: "October 20, 2026",
    readTime: "5 min read",
  },
  {
    id: 2,
    category: "Health & Safety",
    title: "Things You Should Know Before Donating Blood",
    description:
      "Learn about the essential requirements, health tips, and preparation steps to make your blood donation safe and successful.",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    date: "October 18, 2026",
    readTime: "4 min read",
  },
  {
    id: 3,
    category: "Awareness",
    title: "The Importance of Regular Blood Donation",
    description:
      "Regular blood donors play a vital role in ensuring hospitals have enough blood for emergencies and medical treatments.",
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
    date: "October 15, 2026",
    readTime: "6 min read",
  },
  {
    id: 4,
    category: "Inspiration",
    title: "Be a Hero: Make Blood Donation a Habit",
    description:
      "You don't need superpowers to be a hero. Your willingness to donate blood can bring hope to someone in need.",
    image:
      "https://images.unsplash.com/photo-1536856136534-bb679c6b6e16?auto=format&fit=crop&w=800&q=80",
    date: "October 12, 2026",
    readTime: "3 min read",
  },
];

const BlogSection = () => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (!carouselRef.current) return;

    carouselRef.current.scrollBy({
      left: direction === "next" ? 350 : -350,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
              <Heart size={16} fill="currentColor" />
              LifeDrop Blog
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Stories That <span className="text-red-600">Save Lives</span>
            </h2>

            <p className="mt-4 max-w-2xl text-gray-500">
              Discover inspiring stories, helpful health tips, and
              everything you need to know about blood donation.
            </p>
          </div>

          {/* Carousel Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll("prev")}
              aria-label="Previous blog posts"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={() => scroll("next")}
              aria-label="Next blog posts"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Blog Carousel */}
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="group w-[85%] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[48%] lg:w-[32%]"
            >
              {/* Blog Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />

                <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm">
                  {blog.category}
                </span>
              </div>

              {/* Blog Content */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3 text-xs text-gray-400">
                  <span>{blog.date}</span>
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  <span>{blog.readTime}</span>
                </div>

                <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900 transition group-hover:text-red-600">
                  {blog.title}
                </h3>

                <p className="mb-6 line-clamp-3 text-sm leading-7 text-gray-500">
                  {blog.description}
                </p>

                <button
                  className="inline-flex items-center gap-2 font-semibold text-red-600 transition hover:gap-3"
                  onClick={() =>
                    console.log("Read blog:", blog.title)
                  }
                >
                  Read More
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl bg-red-50 p-6 sm:flex-row">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Every Drop Counts!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Be a lifesaver. Become a blood donor today.
            </p>
          </div>

          <a
            href="/register"
            className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Become a Donor
          </a>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;

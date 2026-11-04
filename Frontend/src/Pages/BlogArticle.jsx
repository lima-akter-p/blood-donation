import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Link, useParams } from "react-router";
import { blogPosts } from "../data/blogPosts";

export default function BlogArticle() {
  const { slug } = useParams();
  const post = blogPosts.find((article) => article.slug === slug);

  if (!post) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Article not found</h1>
          <p className="mt-3 text-sm text-slate-600">This article may have moved or is no longer available.</p>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 font-bold text-rose-600">
            <ArrowLeft size={17} /> Browse all articles
          </Link>
        </div>
      </main>
    );
  }

  const currentIndex = blogPosts.findIndex((article) => article.id === post.id);
  const nextPost = blogPosts[(currentIndex + 1) % blogPosts.length];

  return (
    <main className="bg-[#f8f8fa] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="p-5 sm:p-8 lg:p-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800">
            <ArrowLeft size={17} /> All articles
          </Link>
          <div className="mt-8 inline-flex rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
            {post.category}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{post.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2"><CalendarDays size={16} />{post.date}</span>
            <span className="inline-flex items-center gap-2"><Clock3 size={16} />{post.readTime}</span>
          </div>
        </div>

        <img src={post.image} alt={post.title} className="h-64 w-full object-cover sm:h-96" />

        <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <p className="text-lg leading-8 text-slate-700">{post.introduction}</p>
          <div className="mt-8 space-y-8">
            {post.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{section.title}</h2>
                <div className="mt-3 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-8 text-slate-600 sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
            This article provides general information only. Donation eligibility and
            aftercare guidance vary; follow instructions from an authorized blood
            donation service or qualified healthcare professional.
          </aside>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">
              <ArrowLeft size={17} /> Explore all articles
            </Link>
            <Link to={`/blog/${nextPost.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">
              Next: {nextPost.title} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

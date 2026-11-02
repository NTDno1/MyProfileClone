import Post from '@/components/shared/Post';
import { posts } from '@/data/posts';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

const BlogSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-600 tracking-[0.3em] uppercase">LATEST ARTICLES</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center tracking-tight">
          Latest Posts
        </h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts
            .filter((_, index) => index < 3)
            .map((post) => (
              <Post
                key={post.id}
                href={`/blog/${post.id}`}
                thumbnailUrl={post.thumbnailUrl}
                title={post.title}
                publishedAt={post.publishedAt}
              />
            ))}
        </div>

        <div className="mt-12 text-center">
          <Link href={'/blog'}>
            <a className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-300">
              VIEW ALL POSTS
              <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;

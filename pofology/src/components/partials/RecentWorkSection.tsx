import Portfolio from '@/components/shared/Portfolio';
import { works } from '@/data/works';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

const RecentWorkSection = () => {
  return (
    <section className="py-24 bg-[#0F0F1A]">
      <div className="container">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-400 tracking-[0.3em] uppercase">MY WORK</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tight">
          Recent Works
        </h2>

        <div className="mt-16 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6">
          {works
            .filter((_, index) => index < 6)
            .map((work) => (
              <Portfolio
                key={work.id}
                imageUrl={work.thumbnailUrl}
                category={work.category}
                title={work.title}
                href={`/works/${work.id}`}
              />
            ))}
        </div>

        <div className="mt-12 text-center">
          <Link href={'/works'}>
            <a className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/10 text-white font-bold text-sm hover:bg-white/5 hover:border-white/20 transition-all duration-300">
              VIEW ALL WORKS
              <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentWorkSection;

import { services } from '@/data/services';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiArrowRight } from 'react-icons/fi';

const ServiceSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-[#0B0B0F]" id="services">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-[#0B0B0F] to-purple-950/50" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container relative z-10">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-400 tracking-[0.3em] uppercase">WHAT I DO</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tight">
          My Services
        </h2>

        {/* Services Grid - 3 columns */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 cursor-default"
            >
              {/* Number */}
              <div className="mb-4">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                {service.name}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {service.description}
              </p>

              {/* Hover arrow */}
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>LEARN MORE</span>
                <FiArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-base mb-4">
            Looking for a custom service?
          </p>
          <Link href="/#contact"><a
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-indigo-500/50 text-indigo-400 font-bold text-sm hover:bg-indigo-500/10 hover:border-indigo-400 transition-all duration-300"
          >
            CLICK HERE TO CONTACT ME
            <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a></Link>
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;

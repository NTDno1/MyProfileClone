import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiArrowRight } from 'react-icons/fi';

const AboutSection = () => {
  const { t } = useLanguage();

  const stats = [
    { value: '4+', label: 'Years Experience' },
    { value: '30+', label: 'Projects Done' },
    { value: '20+', label: 'Happy Clients' },
  ];

  const skills = ['.NET', 'SQL Server', 'Clean Architecture', 'CQRS Pattern'];

  return (
    <section className="py-24 bg-white" id="about">
      <div className="container">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-600 tracking-[0.3em] uppercase">ABOUT ME</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center tracking-tight">
          About Me
        </h2>

        {/* Main Content - Image LEFT + Text RIGHT */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Image */}
          <div className="relative">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/avatar/ava1.jpg"
                alt="Nguyen Tien Dat"
                layout="fill"
                className="object-cover"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="space-y-6">
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {t('about.description')}
            </p>
            
            <p className="text-gray-500 text-base leading-relaxed">
              I am a quick learner who is passionate about technology and always eager to explore new things. My goal is to meet and exceed expectations with quality work.
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-3 pt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Download CV */}
            <Link href="/cv"><a
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:opacity-90 transition-all duration-300 mt-4"
            >
              DOWNLOAD CV
              <FiArrowRight size={18} />
            </a></Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

import { educations } from '@/data/educations';
import { experiences } from '@/data/experiences';
import { FiBriefcase, FiMapPin, FiCalendar } from 'react-icons/fi';
import { MdSchool } from 'react-icons/md';

const ExperienceSection = () => {
  return (
    <section className="py-24 bg-[#0B0B0F]" id="experience">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/50 via-[#0B0B0F] to-indigo-950/50" />
      
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
          <span className="text-sm font-bold text-indigo-400 tracking-[0.3em] uppercase">WORK & EDUCATION</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tight">
          Experience & Education
        </h2>

        {/* Split layout: Experience LEFT, Education RIGHT */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <FiBriefcase className="text-indigo-400 w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white">Work Experience</h3>
            </div>

            <div className="relative pl-6">
              {/* Gradient vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full" />

              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <div key={index} className="relative pl-8">
                    {/* Dot on the line */}
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#0B0B0F] shadow-lg shadow-indigo-500/50" />

                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                      {/* Header */}
                      <h4 className="text-base font-bold text-white leading-tight mb-1">{exp.jobTitle}</h4>
                      <p className="text-sm font-bold text-indigo-400 mb-3">{exp.company}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <FiCalendar size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <MdSchool className="text-purple-400 w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white">Education</h3>
            </div>

            <div className="relative pl-6">
              {/* Gradient vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 rounded-full" />

              <div className="space-y-6">
                {educations.map((edu, index) => (
                  <div key={index} className="relative pl-8">
                    {/* Dot on the line */}
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-[#0B0B0F] shadow-lg shadow-purple-500/50" />

                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                      {/* Header */}
                      <h4 className="text-base font-bold text-white leading-tight mb-1">{edu.degree}</h4>
                      <div className="flex items-center gap-1.5 mb-3">
                        <FiMapPin size={12} className="text-gray-500" />
                        <p className="text-sm font-medium text-gray-400">{edu.school}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <FiCalendar size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {edu.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;

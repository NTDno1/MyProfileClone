import React from 'react';

const skillGroups = [
  {
    category: 'Frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
  },
  {
    category: 'Backend',
    skills: ['.NET Core', 'ASP.NET Web API', 'C# 13', 'Entity Framework Core', 'Dapper', 'Clean Architecture', 'CQRS', 'DDD'],
  },
  {
    category: 'Database',
    skills: ['SQL Server', 'PostgreSQL', 'pgvector', 'Redis', 'MongoDB', 'Stored Procedures', 'Query Optimization'],
  },
  {
    category: 'DevOps & Tools',
    skills: ['Docker', 'AWS S3', 'RabbitMQ', 'SignalR', 'ELK Stack', 'Git', 'CI/CD', 'NGINX'],
  },
];

const SkillsSection = () => {
  return (
    <section className="py-24 bg-[#0F0F1A]" id="skills">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-[#0F0F1A] to-purple-950/40" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container relative z-10">
        {/* Split layout: LEFT label + RIGHT skills grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left: Section Label + Title */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <span className="text-sm font-bold text-indigo-400 tracking-[0.3em] uppercase">EXPERTISE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Technical Skills
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mt-4">
              A comprehensive toolkit for building modern, scalable web applications.
            </p>
          </div>

          {/* Right: Skills Grid */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {skillGroups.map((group, catIndex) => {
                const colors = [
                  { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400', tag: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' },
                  { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', tag: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
                  { border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-400', tag: 'bg-pink-500/10 text-pink-300 border border-pink-500/20' },
                  { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400', tag: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' },
                ];
                const c = colors[catIndex];
                
                return (
                  <div
                    key={catIndex}
                    className={`bg-white/[0.03] border ${c.border} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
                  >
                    <h3 className={`text-lg font-bold ${c.text} mb-4`}>
                      {group.category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${c.tag} hover:brightness-125 transition-all cursor-default`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;

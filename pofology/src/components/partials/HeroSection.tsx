import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0B0B0F] pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-[#0B0B0F] to-purple-950/40" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main content */}
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-4rem)] py-16 lg:py-0">

          {/* Left: Text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-indigo-400 text-sm font-semibold">Available for hire</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-1">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight">
                Hello, I&apos;m
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-[0.95] tracking-tight">
                Nguyen Tien Dat
              </h1>
            </div>

            {/* Role */}
            <p className="text-xl sm:text-2xl font-bold text-gray-400">
              Senior .NET Backend Developer
            </p>

            {/* Description */}
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg">
              I craft robust backend systems using Clean Architecture, CQRS, microservices, and modern AI solutions that drive business growth and user engagement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/works">
                <a className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:opacity-90 transition-all duration-300">
                  MY PORTFOLIO
                  <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
              <Link href="/#contact">
                <a className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/10 text-white font-bold text-sm hover:bg-white/5 hover:border-white/20 transition-all duration-300">
                  CONTACT ME
                  <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-12 pt-4">
              {[
                { value: '4+', label: 'Years Experience' },
                { value: '30+', label: 'Projects Done' },
                { value: '20+', label: 'Happy Clients' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-semibold tracking-wider uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Avatar */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Subtle glow */}
              <div className="absolute -inset-12 bg-gradient-to-br from-indigo-600/15 to-purple-600/15 rounded-full blur-3xl" />
              
              {/* Avatar */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden shadow-2xl ring-2 ring-white/10">
                <Image
                  src="/images/avatar/ava1.jpg"
                  alt="Nguyen Tien Dat"
                  layout="fill"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-40">
        <span className="text-white text-xs font-semibold tracking-widest uppercase">Scroll</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

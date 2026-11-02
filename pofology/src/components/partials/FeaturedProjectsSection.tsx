import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiGithub, FiExternalLink } from 'react-icons/fi';

const projects = [
  {
    id: 6,
    title: 'Enterprise AI Platform',
    description: 'Comprehensive enterprise AI platform with RAG chatbot, semantic search, AI agents, voice AI, and multi-provider gateway.',
    tags: ['.NET 8', 'PostgreSQL', 'pgvector', 'Redis', 'Ollama', 'React'],
    image: '/images/works/portfolio-website.png',
    previewUrl: 'https://github.com/NTDno1/AIEnterprise',
    demoUrl: '/works/6',
  },
  {
    id: 1,
    title: 'Base Structure (Backend Template)',
    description: 'A robust backend template built with Clean Architecture, CQRS pattern, JWT authentication, and comprehensive testing infrastructure.',
    tags: ['.NET 9', 'Clean Architecture', 'CQRS', 'PostgreSQL', 'JWT', 'Docker'],
    image: '/images/works/portfolio-website.png',
    previewUrl: 'https://github.com/NTDno1/BaseProject',
    demoUrl: '/works/1',
  },
  {
    id: 5,
    title: 'Document Management System',
    description: 'Government-grade document management system with microservices architecture, API Gateway, and high-availability deployment.',
    tags: ['.NET', 'Ocelot', 'Docker Swarm', 'SQL Server', 'Redis', 'RabbitMQ'],
    image: '/images/works/portfolio-website.png',
    previewUrl: 'https://github.com/NTDno1/BaseProject',
    demoUrl: '/works/5',
  },
  {
    id: 3,
    title: 'Real-time Chat Application',
    description: 'Production-ready real-time chat application with WebSocket communication, JWT authentication, and online status tracking.',
    tags: ['.NET 8', 'SignalR', 'PostgreSQL', 'RabbitMQ', 'Angular 17', 'JWT'],
    image: '/images/works/social-media-app.png',
    previewUrl: 'https://github.com/NTDno1/LearnRabitMQ',
    demoUrl: '/works/3',
  },
  {
    id: 2,
    title: 'Education Management System',
    description: 'Full-stack education management system covering student records, course management, enrollment, and academic reporting.',
    tags: ['.NET', 'React', 'SQL Server', 'JWT', 'FluentValidation'],
    image: '/images/works/social-media-app.png',
    previewUrl: 'https://gitlab.com/NTDno1/sep490_g22',
    demoUrl: '/works/2',
  },
  {
    id: 4,
    title: 'ERP System Integration',
    description: 'Enterprise ERP system covering core business modules (Finance, Supply Chain, Inventory, HR, CRM) with real-time synchronization.',
    tags: ['.NET', 'AngularJS', 'SQL Server', 'Redis', 'RabbitMQ'],
    image: '/images/works/portfolio-website.png',
    previewUrl: 'https://github.com/NTDno1/BaseProject',
    demoUrl: '/works/4',
  },
];

const FeaturedProjectsSection = () => {
  return (
    <section className="py-24 bg-white" id="projects">
      <div className="container">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-600 tracking-[0.3em] uppercase">PORTFOLIO</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center tracking-tight">
          Featured Projects
        </h2>

        {/* 6 cards - 3x2 grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <Image
                  src={project.image}
                  alt={project.title}
                  layout="fill"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Hover overlay with links */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <FiGithub size={20} />
                  </a>
                  <Link href={project.demoUrl}>
                    <a className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                      <FiExternalLink size={20} />
                    </a>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{project.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    <FiGithub size={14} />
                    CODE
                  </a>
                  <Link href={project.demoUrl}>
                    <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      DEMO
                      <FiExternalLink size={14} />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjectsSection;

import { Work } from '@/types';

export const works: Work[] = [
  {
    id: 1,
    title: 'Base Structure (Backend Template)',
    category: 'Backend Development',
    thumbnailUrl: '/images/works/portfolio-website.png',
    description: `This is a robust e-commerce platform built with .NET 9, utilizing ASP.NET Core, Entity Framework Core, and MediatR. It follows Clean Architecture and CQRS design patterns for scalability and maintainability. Key features include secure user authentication with JWT, comprehensive product management, and robust validation with FluentValidation. The project use PostgreSQL for data storage, integrates extensive logging and error handling, and supports unit and integration testing for reliability. It is designed to handle high-traffic environments with a strong focus on security and performance optimization.`,
    publishedAt: '01 Jan 2024',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://github.com/NTDno1/BaseProject',
    featureList: [
      'Clean Architecture & CQRS Pattern',
      'JWT Authentication & Authorization',
      'Entity Framework Core with PostgreSQL',
      'FluentValidation for robust validation',
      'AutoMapper for object mapping',
      'Serilog for comprehensive logging',
      'Unit & Integration Testing',
      'RESTful API Design',
      'Performance Optimization',
      'Security Best Practices',
      'Docker Support',
      'Comprehensive Error Handling',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Personal Project',
      },
      {
        name: 'Start Date',
        value: '01 Jan 2024',
      },
      {
        name: 'End Date',
        value: 'Ongoing',
      },
      {
        name: 'Category',
        value: 'Backend Development',
      },
      {
        name: 'Skills',
        value: '.NET 9, C# 13, ASP.NET Core, EF Core, PostgreSQL, Clean Architecture, CQRS',
      },
      {
        name: 'Repository',
        value: 'GitHub',
      },
      {
        name: 'License',
        value: 'MIT',
      },
    ],
  },
  {
    id: 2,
    title: 'Education Management System',
    category: 'Fullstack Development',
    thumbnailUrl: '/images/works/social-media-app.png',
    description: `This project is developed with a back-end using C# based on a 3-layer architecture. It integrates JWT Token for authentication, FluentValidation for input data validation, Entity Framework for data retrieval, AutoMapper for data standardization and mapping, and SQL Server as the database management system. On the front-end, the project utilizes React.js to fetch data from the API and provides an interactive, flexible user interface.`,
    publishedAt: '01 Aug 2023',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://gitlab.com/NTDno1/sep490_g22',
    featureList: [
      '3-Layer Architecture',
      'JWT Token Authentication',
      'FluentValidation for input validation',
      'Entity Framework for data access',
      'AutoMapper for data mapping',
      'SQL Server Database',
      'React.js Frontend',
      'RESTful API',
      'Interactive UI',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Personal Project',
      },
      {
        name: 'Start Date',
        value: '01 Aug 2023',
      },
      {
        name: 'End Date',
        value: '01 Dec 2023',
      },
      {
        name: 'Category',
        value: 'Fullstack Development',
      },
      {
        name: 'Skills',
        value: '.NET, ReactJS, SQL, JWT Token',
      },
      {
        name: 'Repository',
        value: 'GitLab',
      },
    ],
  },
];

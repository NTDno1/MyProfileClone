import { Experience } from '@/types';

export const experiences: Experience[] = [
  {
    jobTitle: 'Backend Developer',
    company: 'MobiFoneIT',
    startDate: '05/2025',
    endDate: 'Now',
    description: 'Document Management System for the Ministry of Finance - Designed a multi-layer system using RESTful APIs, LINQ, Dapper, and stored procedures for scalable and maintainable data access. Deployed the system on parallel IIS servers with load balancing and implemented SQL Server read/write replication to ensure high availability, scalability, and optimized performance for concurrent users. Built a dedicated file storage server with digital signature and automated PDF conversion, ensuring secure document handling and stable, maintainable on-premise infrastructure.',
  },
  {
    jobTitle: 'Backend Developer',
    company: 'AgileTech',
    startDate: '1/2024',
    endDate: '05/2025',
    description: 'Technical Leadership: Led a 4-member team, establishing coding standards using Clean Architecture and Fluent Validation to reduce bugs and technical debt. System Development: Developed and deployed an ERP application using .NET 9 and Angular, implementing the CQRS architecture and modern DevOps practices. Real-time & Distributed Messaging: Integrated Redis, RabbitMQ, and SignalR to enable real-time communication and distributed messaging. Designed and implemented Redis-based authentication to manage access tokens and prevent unauthorized logins across multiple devices. Utilized RabbitMQ and SignalR to process background jobs and push real-time notifications to users. Performance Optimization: Optimized system performance with LINQ, stored procedures, and Quartz for background job scheduling. Deployment & Scalability: Integrated AWS S3 for file storage and deployed the application on both Windows (IIS) and Ubuntu (Docker/Docker Compose), ensuring flexible, consistent, and highly available environments.',
  },
  {
    jobTitle: 'Fullstack Developer',
    company: 'HopLongTech',
    startDate: '08/2022',
    endDate: '12/2023',
    description: 'ERP System: Managed the development and maintenance of a full-scale ERP application covering core business modules (Finance, Supply Chain, Inventory, HR, CRM). Applied Dapper and LINQ for efficient data access and manipulation, resulting in optimized database queries and improved throughput. Database Optimization: Handled complex data scenarios involving large tables. Successfully resolved critical database deadlocks and optimized Stored Procedures, significantly reducing report generation time. Built responsive and user-friendly frontend modules with AngularJS, ensuring smooth interaction and real-time updates. Ensured high system stability by applying clean architecture principles and performance tuning. E-commerce Integration: Built a middleware service from scratch to integrate Tik Tok platform APIs and synchronize data with the ERP system. Designed the solution based on a Three-Layer Architecture (Presentation, Business Logic, Data Access) to ensure extensibility and scalability. Implemented a bi-directional API integration with Tik Tok, leveraging webhook support for real-time synchronization of orders, inventory, and customer data. Developed a Facebook Ads data pipeline to extract, transform, and load campaign performance metrics into the ERP system.',
  },
];

import { Experience } from '@/types';

export const experiences: Experience[] = [
  {
    jobTitle: 'Back-End Developer',
    company: 'VNR Software',
    startDate: 'Jan 2024',
    endDate: 'Present',
    description: 'Developed and deployed an ERP application using .NET 9 and Angular, implementing CQRS architecture and modern DevOps practices. Integrated Redis, RabbitMQ and SignalR to enable real-time communication, distributed messaging and secure multi-device authentication. Optimized system performance with LINQ, stored procedures and background jobs using Quartz. Integrated AWS S3 for file storage and deployed the application on both Windows (IIS) and Ubuntu (Docker, Docker Compose), ensuring high availability and scalability.',
  },

  {
    jobTitle: 'Fullstack Developer',
    company: 'HOP LONG TECH',
    startDate: 'Aug 2022',
    endDate: 'Dec 2023',
    description: 'Experienced in developing scalable enterprise systems using .NET and modern architectural patterns. Successfully delivered ERP and integration solutions with a strong focus on performance, maintainability, and clean architecture. Led the development and maintenance of a full-scale ERP application covering key business modules such as Finance, Supply Chain, Inventory, HR, and CRM.',
  },
];

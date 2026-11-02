import { Service } from '@/types';

export const services: Service[] = [
  {
    name: 'Backend Development',
    description: 'Design and develop secure, scalable backend systems using .NET, C#, and modern architectural patterns like Clean Architecture and CQRS.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'Database Design',
    description: 'Expert in SQL Server database design, optimization, and management. Experienced with Entity Framework Core and LINQ for efficient data access.',
    image: '/images/services/ui-ux.png',
  },
  {
    name: 'System Integration',
    description: 'Build middleware services and API integrations for e-commerce platforms, ERP systems, and third-party services with real-time synchronization.',
    image: '/images/services/mobile-app.png',
  },
  {
    name: 'Microservices & DevOps',
    description: 'Design and implement microservices architecture with API Gateway, container orchestration using Docker/Docker Compose, and deploy on both Windows (IIS) and Ubuntu environments.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'API Gateway & Load Balancing',
    description: 'Design and implement API Gateway solutions using Ocelot and NGINX with rate limiting, JWT authentication, and request routing for microservices architectures.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'Distributed Cache & Messaging',
    description: 'Implement Redis for distributed caching and session management, and RabbitMQ for event-driven communication, dead letter queues, and reliable message delivery.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'Logging & Monitoring',
    description: 'Set up ELK Stack (Elasticsearch, Logstash, Kibana) for centralized logging, monitoring, and alerting. Configure Prometheus health checks and distributed tracing for microservices.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'Microservices Orchestration',
    description: 'Orchestrate microservices using Docker Swarm with service discovery, load balancing, rolling updates, and auto-scaling for high-availability deployments.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'AI Platform & RAG Pipeline',
    description: 'Build enterprise AI platforms with semantic search, RAG chatbot, vector database (pgvector), multi-provider AI gateway (Ollama, OpenAI, Claude), and Clean Architecture for AI applications.',
    image: '/images/services/web-development.png',
  },
  {
    name: 'AI Agent & Tool Calling',
    description: 'Develop AI agents with tool calling, human-in-the-loop approval, voice AI (STT/TTS), NL-to-SQL engine, and MCP (Model Context Protocol) integration for enterprise automation.',
    image: '/images/services/web-development.png',
  },
];

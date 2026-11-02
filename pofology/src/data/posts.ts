import { Post } from '@/types';

export const posts: Post[] = [
  {
    id: 5,
    title: 'Enterprise AI Platform - AI Base Framework: Building a Reusable AI Platform for Enterprise Systems',
    publishedAt: '01 Jun 2026',
    thumbnailUrl: '/images/posts/post-thumbnail-3.png',
    imageUrl: '/images/posts/post-03.png',
    authorName: 'Nguyen Tien Dat',
    content: `
    <h2>Overview</h2>
    <p>
      <strong>Enterprise AI Platform (AI Base Framework)</strong> is a comprehensive enterprise AI platform designed with the vision: <em>"Chỉ cần cắm AI vào hệ thống khác là có thể sử dụng được"</em> (Just plug AI into other systems and it works). The platform provides ready-to-use AI capabilities that can be integrated into ERP, DMS, CRM, HRM, Workflow, and BI systems.
    </p>

    <h2>Key Features</h2>

    <h3>1. Semantic Search & RAG Chatbot</h3>
    <ul>
      <li><strong>Vector Search</strong>: Semantic search with pgvector HNSW index for high accuracy</li>
      <li><strong>Hybrid Search</strong>: Combines vector and keyword search for optimal results</li>
      <li><strong>RAG Pipeline</strong>: Retrieval Augmented Generation for accurate, source-cited answers</li>
      <li><strong>Document Processing</strong>: Upload, chunk (512 tokens), embed, and index documents automatically</li>
      <li><strong>Multi-language Support</strong>: Vietnamese and English</li>
    </ul>

    <h3>2. AI Agent & Tool Calling</h3>
    <ul>
      <li><strong>Agent Orchestrator</strong>: Multi-step task planning and execution</li>
      <li><strong>Tool Registry</strong>: Dynamic tool registration and execution</li>
      <li><strong>Safety Guardrails</strong>: Enterprise security for AI actions</li>
      <li><strong>Human-in-the-loop Approval</strong>: Sensitive actions require human approval</li>
      <li><strong>Audit & Traceability</strong>: Full action logging and rollback support</li>
    </ul>

    <h3>3. Natural Language to SQL</h3>
    <ul>
      <li><strong>NL to SQL Engine</strong>: Convert natural language questions to SQL queries</li>
      <li><strong>SQL Injection Protection</strong>: Query validation, only SELECT queries allowed</li>
      <li><strong>RBAC Integration</strong>: AI respects user permissions in database queries</li>
    </ul>

    <h3>4. Voice AI</h3>
    <ul>
      <li><strong>Speech-to-Text</strong>: Whisper integration for voice input</li>
      <li><strong>Text-to-Speech</strong>: Voice output for AI responses</li>
      <li><strong>Voice Commands</strong>: Execute AI actions via voice</li>
    </ul>

    <h3>5. AI Gateway & Multi-Provider Support</h3>
    <ul>
      <li><strong>Ollama (Local)</strong>: 100% offline, llama3.2:3b, nomic-embed-text</li>
      <li><strong>OpenAI</strong>: GPT-4, GPT-3.5-turbo</li>
      <li><strong>Claude</strong>: Anthropic Claude models</li>
      <li><strong>Gemini</strong>: Google Gemini Pro</li>
      <li><strong>Azure OpenAI</strong>: Enterprise Azure integration</li>
      <li><strong>DeepSeek</strong>: Cost-effective AI</li>
      <li><strong>Dynamic Routing</strong>: Load balancing, fallback, cost-aware, latency-aware routing</li>
    </ul>

    <h3>6. Integration - MCP (Model Context Protocol)</h3>
    <ul>
      <li><strong>MCP Server</strong>: AI-native protocol for external system integration</li>
      <li><strong>REST API & gRPC</strong>: Standard API integration</li>
      <li><strong>WebSocket</strong>: Real-time communication</li>
      <li><strong>Event-Driven</strong>: RabbitMQ-ready for async workflows</li>
    </ul>

    <h2>Architecture</h2>

    <h3>High-Level Architecture</h3>
    <pre>
Client Layer (Web, Mobile, Voice, CLI)
         │
         ▼
API Gateway Layer (Auth, Rate Limiting, Tenant Resolution)
         │
         ▼
Platform Core (Modular Monolith)
├── Tenant Management Module
├── Auth & Security Module
├── AI Agent Runtime Module
├── AI Engine Core Module
├── Plugin Runtime Module
├── Workflow Engine Module
├── Document Pipeline Module
├── Search Engine Module
└── Integration Hub Module
         │
         ▼
AI Infrastructure Layer
├── AI Gateway (Router)
├── Embedding Engine
├── Vector Store
├── Model Registry
└── Tool Registry
         │
         ▼
AI Providers (Ollama, OpenAI, Claude, Gemini, Azure, DeepSeek)
    </pre>

    <h3>Design Principles</h3>
    <ul>
      <li><strong>Hybrid Architecture</strong>: Modular Monolith → Gradual Microservice Extraction</li>
      <li><strong>Plugin-based</strong>: Extensible for 3rd party integration</li>
      <li><strong>Agent-based</strong>: AI-native autonomous actions</li>
      <li><strong>Event-driven</strong>: Async communication patterns</li>
      <li><strong>Domain-Driven Design</strong>: Bounded contexts, shared kernel</li>
    </ul>

    <h2>Technology Stack</h2>
    <table>
      <tr><th>Component</th><th>Technology</th></tr>
      <tr><td>Backend</td><td>.NET 8, ASP.NET Core, MediatR, CQRS</td></tr>
      <tr><td>Frontend</td><td>Next.js 14, React 18, TailwindCSS, Zustand</td></tr>
      <tr><td>Database</td><td>PostgreSQL 16 + pgvector (Vector DB)</td></tr>
      <tr><td>Cache</td><td>Redis 7</td></tr>
      <tr><td>Object Storage</td><td>MinIO (S3-compatible)</td></tr>
      <tr><td>LLM (Local)</td><td>Ollama, llama3.2:3b, nomic-embed-text, whisper</td></tr>
      <tr><td>Logging</td><td>Serilog, Seq</td></tr>
      <tr><td>Container</td><td>Docker, Docker Compose, Nginx</td></tr>
    </table>

    <h2>Security Features</h2>
    <ul>
      <li><strong>JWT Authentication</strong> with refresh tokens</li>
      <li><strong>SQL Injection Protection</strong> with query validation</li>
      <li><strong>Prompt Injection Detection</strong></li>
      <li><strong>Rate Limiting</strong> per user/tenant</li>
      <li><strong>RBAC</strong> (Role-Based Access Control)</li>
      <li><strong>Audit Logging</strong> for compliance</li>
      <li><strong>Human-in-the-loop Approval</strong> for sensitive actions</li>
      <li><strong>Zero Trust Architecture</strong></li>
    </ul>

    <h2>Multi-Tenancy</h2>
    <ul>
      <li><strong>Row-Level Security</strong> for tenant isolation</li>
      <li><strong>Per-tenant AI configuration</strong></li>
      <li><strong>Tenant-specific rate limits</strong></li>
      <li><strong>Configurable LLM models and prompts</strong></li>
    </ul>

    <h2>Roadmap</h2>
    <ol>
      <li><strong>Phase 1 (Current)</strong>: Core RAG, Semantic Search, Basic Chatbot</li>
      <li><strong>Phase 2</strong>: AI Agent, Tool Calling, MCP Integration</li>
      <li><strong>Phase 3</strong>: Voice AI, Multi-provider Gateway</li>
      <li><strong>Phase 4</strong>: Enterprise Integration Hub, Plugin System</li>
      <li><strong>Phase 5</strong>: Advanced Agentic AI, Autonomous Workflows</li>
    </ol>

    <h2>Vision</h2>
    <p>
      The goal is not just to build a single AI application, but to develop it into an <strong>Enterprise AI Platform</strong> that can be used across multiple business systems. The vision is: <em>"Chỉ cần cắm AI vào hệ thống khác là có thể sử dụng được"</em> — Just plug AI into other systems and it works.
    </p>

    <p>
      This platform aims to serve as an <strong>AI Agent Platform</strong>, <strong>AI Copilot Platform</strong>, <strong>Internal AI Operating System</strong>, <strong>AI Integration Hub</strong>, and <strong>AI Automation Platform</strong> for enterprise systems including ERP, DMS, CRM, HRM, Workflow, and BI.
    </p>
    `,
  },
  {
    id: 1,
    title: 'BaseProject Clean Architecture, DDD Pattern',
    publishedAt: '15 Jan 2024',
    thumbnailUrl: '/images/posts/post-thumbnail-1.png',
    imageUrl: '/images/posts/post-01.png',
    authorName: 'Nguyễn Tiến Đạt',
    content: `
    <h2>Giới Thiệu</h2>
    <p>
      Dự án này là một ứng dụng <strong>ASP.NET Core Web API</strong> được xây dựng theo kiến trúc <strong>Clean Architecture</strong> (hoặc Onion Architecture). Mục tiêu của dự án là cung cấp một cấu trúc nền tảng (Base Project) mẫu mực, tích hợp các thực hành tốt nhất (Best Practices) như CQRS, Dependency Injection, Logging và API Versioning.
    </p>
    
    <h2>Công Nghệ & Thư Viện Chính</h2>
    <ul>
      <li><strong>Core Framework</strong>: .NET (ASP.NET Core 6/7/8)</li>
      <li><strong>Kiến trúc</strong>: Clean Architecture</li>
      <li><strong>Xử lý Logic</strong>: MediatR (triển khai mẫu CQRS)</li>
      <li><strong>Data Access (ORM)</strong>:
        <ul>
          <li><strong>Entity Framework Core</strong>: Dùng cho các thao tác ghi (Command) và quản lý Schema, Migrations</li>
          <li><strong>Dapper</strong>: Dùng cho các thao tác đọc (Query) hiệu năng cao</li>
        </ul>
      </li>
      <li><strong>API & Routing</strong>: Controllers (truyền thống) và Minimal APIs (sử dụng thư viện Carter)</li>
      <li><strong>Validation</strong>: FluentValidation</li>
      <li><strong>Mapping</strong>: AutoMapper</li>
      <li><strong>Logging</strong>: Serilog</li>
      <li><strong>Documentation</strong>: Swagger (Swashbuckle) với hỗ trợ API Versioning</li>
    </ul>
    
    <h2>Cấu Trúc Dự Án</h2>
    <p>Dự án được tổ chức trong thư mục <code>src</code> với các tầng (layer) rõ ràng:</p>
    <ul>
      <li><strong>DemoCICD.API</strong>: Entry point của ứng dụng</li>
      <li><strong>DemoCICD.Core</strong>: Lõi của ứng dụng, không phụ thuộc vào công nghệ bên ngoài</li>
      <li><strong>DemoCICD.Infrastructure Layer</strong>: Giao tiếp với dịch vụ bên ngoài và Database</li>
      <li><strong>DemoCICD.Presentation</strong>: Tách biệt logic trình bày khỏi API chính</li>
    </ul>
    
    <h2>Các Tính Năng & Patterns Nổi Bật</h2>
    <ol>
      <li><strong>CQRS</strong>: Tách biệt luồng Ghi và Đọc</li>
      <li><strong>Global Exception Handling</strong>: Xử lý lỗi tập trung</li>
      <li><strong>API Versioning</strong>: Hỗ trợ versioning cho API</li>
      <li><strong>Swagger</strong>: Tài liệu hóa API tự động</li>
      <li><strong>Hybrid Data Access</strong>: Kết hợp EF Core và Dapper</li>
    </ol>
    
    <p><strong>Repository:</strong> <a href="https://github.com/NTDno1/BaseProject" target="_blank">https://github.com/NTDno1/BaseProject</a></p>
    `,
  },
  {
    id: 2,
    title: 'Chat APP',
    publishedAt: '20 Feb 2024',
    thumbnailUrl: '/images/posts/post-thumbnail-2.png',
    imageUrl: '/images/posts/post-02.png',
    authorName: 'Nguyễn Tiến Đạt',
    content: `
    <h2>Tổng quan</h2>
    <p>
      Ứng dụng chat real-time được xây dựng với:
    </p>
    <ul>
      <li><strong>Backend</strong>: .NET 8 + SignalR + PostgreSQL + RabbitMQ</li>
      <li><strong>Frontend</strong>: Angular 17 + SignalR Client</li>
      <li><strong>Database</strong>: PostgreSQL</li>
      <li><strong>Real-time</strong>: SignalR WebSocket</li>
    </ul>
    
    <h2>Database Schema</h2>
    <h3>Tables</h3>
    <ul>
      <li><strong>Users</strong>: Quản lý thông tin người dùng, trạng thái online/offline</li>
      <li><strong>Conversations</strong>: Quản lý các cuộc trò chuyện giữa 2 người dùng</li>
      <li><strong>Messages</strong>: Lưu trữ tin nhắn với thông tin sender, receiver, nội dung và trạng thái đã đọc</li>
    </ul>
    
    <h2>Authentication</h2>
    <p>Hệ thống hỗ trợ đăng ký và đăng nhập với JWT Token. Token được lưu trong localStorage và được gửi kèm trong header <code>Authorization: Bearer &lt;token&gt;</code> hoặc query string cho SignalR.</p>
    
    <h2>Chat API</h2>
    <ul>
      <li><strong>Lấy danh sách Users</strong>: <code>GET /api/Messages/users?search=keyword</code></li>
      <li><strong>Lấy danh sách Conversations</strong>: <code>GET /api/Messages/conversations</code></li>
      <li><strong>Lấy tin nhắn trong Conversation</strong>: <code>GET /api/Messages/conversation/{otherUserId}?page=1&pageSize=50</code></li>
      <li><strong>Gửi tin nhắn</strong>: <code>POST /api/Messages/send</code></li>
    </ul>
    
    <h2>SignalR ChatHub</h2>
    <p>SignalR Hub cung cấp các events real-time:</p>
    <ul>
      <li><strong>SendMessage</strong>: Gửi tin nhắn từ client đến server</li>
      <li><strong>ReceiveMessage</strong>: Nhận tin nhắn mới từ server</li>
      <li><strong>UserOnline/UserOffline</strong>: Theo dõi trạng thái online/offline của users</li>
      <li><strong>MarkAsRead</strong>: Đánh dấu tin nhắn đã đọc</li>
    </ul>
    
    <h2>Flow hoạt động</h2>
    <p>Khi user gửi tin nhắn, hệ thống sẽ:</p>
    <ol>
      <li>ChatComponent gọi ChatService.sendMessage()</li>
      <li>SignalR ChatHub.SendMessage() xử lý</li>
      <li>MessageService.SaveMessage() lưu vào Database</li>
      <li>ChatHub phát tới Receiver qua SignalR</li>
      <li>Receiver nhận qua event "ReceiveMessage"</li>
    </ol>
    
    <p><strong>Repository:</strong> <a href="https://github.com/NTDno1/LearnRabitMQ" target="_blank">https://github.com/NTDno1/LearnRabitMQ</a></p>
    `,
  },
  {
    id: 3,
    title: 'Microservice E-Commerce',
    publishedAt: '10 Mar 2024',
    thumbnailUrl: '/images/posts/post-thumbnail-3.png',
    imageUrl: '/images/posts/post-03.png',
    authorName: 'Nguyễn Tiến Đạt',
    content: `
    <h2>Mục Đích</h2>
    <p>
      Dự án triển khai hệ thống <strong>E-Commerce Backend</strong> theo kiến trúc <strong>Microservice</strong>, minh họa các nguyên tắc từ giáo trình "Các Hệ Thống Phân Tán".
    </p>
    
    <h2>Kiến Trúc Tổng Thể</h2>
    <p>Hệ thống bao gồm:</p>
    <ul>
      <li><strong>Frontend</strong>: Angular 17 (http://localhost:4200)</li>
      <li><strong>API Gateway RabbitMQ</strong>: Primary gateway tại port 5010</li>
      <li><strong>Microservices</strong>:
        <ul>
          <li><strong>User Service</strong>: Ports 5001, 5004 (Load Balanced)</li>
          <li><strong>Product Service</strong>: Ports 5002, 5006 (Load Balanced)</li>
          <li><strong>Order Service</strong>: Ports 5003, 5007 (Load Balanced)</li>
        </ul>
      </li>
      <li><strong>Database</strong>: PostgreSQL (mỗi service có database riêng)</li>
      <li><strong>Message Queue</strong>: RabbitMQ</li>
      <li><strong>Logging</strong>: MongoDB Atlas</li>
    </ul>
    
    <h2>Các Tính Năng</h2>
    <h3>1. User Service</h3>
    <ul>
      <li>Đăng nhập/Đăng ký với JWT Authentication</li>
      <li>Xem danh sách users</li>
      <li>Xem chi tiết user</li>
      <li>Cập nhật thông tin</li>
      <li>Xóa user (soft delete)</li>
      <li>Quản lý địa chỉ giao hàng (UserAddresses)</li>
    </ul>
    
    <h3>2. Product Service</h3>
    <ul>
      <li>Xem danh sách sản phẩm</li>
      <li>Tìm kiếm theo category</li>
      <li>Thêm/sửa/xóa sản phẩm</li>
      <li>Quản lý tồn kho</li>
      <li>Quản lý giảm giá (discount pricing)</li>
      <li>Product tags và reviews</li>
    </ul>
    
    <h3>3. Order Service</h3>
    <ul>
      <li>Tạo đơn hàng mới</li>
      <li>Xem danh sách đơn hàng</li>
      <li>Xem đơn hàng theo user</li>
      <li>Cập nhật trạng thái</li>
      <li>Quản lý OrderItems và OrderStatusHistory</li>
      <li>Payment và Shipping information</li>
      <li>Tích hợp RabbitMQ</li>
    </ul>
    
    <h3>4. API Gateway RabbitMQ</h3>
    <ul>
      <li>Single entry point cho tất cả requests</li>
      <li>Route requests qua RabbitMQ</li>
      <li>Load balancing tự động (round-robin)</li>
      <li>Swagger documentation</li>
    </ul>
    
    <h2>Công Nghệ</h2>
    <table>
      <tr>
        <th>Component</th>
        <th>Technology</th>
      </tr>
      <tr>
        <td>Backend Framework</td>
        <td>.NET 8.0</td>
      </tr>
      <tr>
        <td>ORM</td>
        <td>Entity Framework Core</td>
      </tr>
      <tr>
        <td>Database</td>
        <td>PostgreSQL</td>
      </tr>
      <tr>
        <td>Logging</td>
        <td>MongoDB Atlas</td>
      </tr>
      <tr>
        <td>Message Queue</td>
        <td>RabbitMQ</td>
      </tr>
      <tr>
        <td>Authentication</td>
        <td>JWT (JSON Web Tokens)</td>
      </tr>
      <tr>
        <td>Frontend</td>
        <td>Angular 17+</td>
      </tr>
    </table>
    
    <h2>Điểm Nổi Bật</h2>
    <ol>
      <li><strong>Microservice Architecture</strong> - Mỗi service độc lập</li>
      <li><strong>Database Per Service</strong> - Mỗi service có database riêng</li>
      <li><strong>API Gateway RabbitMQ</strong> - Single entry point với load balancing tự động</li>
      <li><strong>Load Balancing</strong> - 2 instances mỗi service, load balancing qua RabbitMQ</li>
      <li><strong>Event-Driven</strong> - RabbitMQ cho async communication và request routing</li>
      <li><strong>JWT Authentication</strong> - Secure authentication với tokens</li>
      <li><strong>Swagger UI</strong> - Tất cả services có documentation</li>
      <li><strong>Docker Compose</strong> - Dễ dàng deploy và scale</li>
    </ol>
    
    <p><strong>Repository:</strong> <a href="https://github.com/NTDno1/BTHTPT" target="_blank">https://github.com/NTDno1/BTHTPT</a></p>
    `,
  },
  {
    id: 4,
    title: 'Document Management System - Phase 2: Microservices Architecture',
    publishedAt: '01 May 2025',
    thumbnailUrl: '/images/posts/post-thumbnail-3.png',
    imageUrl: '/images/posts/post-03.png',
    authorName: 'Nguyen Tien Dat',
    content: `
    <h2>Overview</h2>
    <p>
      Phase 2 of the Document Management System for the Ministry of Finance, evolved from a monolithic multi-layer architecture into a full <strong>Microservices Architecture</strong> to support nationwide deployment across multiple government agencies.
    </p>

    <h2>System Architecture</h2>
    <p>The system consists of multiple layers:</p>

    <h3>1. External Layer</h3>
    <ul>
      <li><strong>Client Applications</strong>: Web browsers, desktop clients</li>
      <li><strong>Mobile Applications</strong>: Native mobile apps for iOS/Android</li>
      <li><strong>Partner Systems</strong>: VBDQ (National Document Exchange), LDAP (Lightweight Directory Access Protocol)</li>
    </ul>

    <h3>2. Load Balancer - NGINX</h3>
    <ul>
      <li>Reverse proxy with SSL termination</li>
      <li>Traffic distribution across multiple API Gateway instances</li>
      <li>Rate limiting and request filtering</li>
    </ul>

    <h3>3. API Gateway - Ocelot</h3>
    <ul>
      <li>Single entry point for all client requests</li>
      <li>JWT Authentication and Authorization</li>
      <li>Request routing, rate limiting, and caching</li>
      <li>Swagger documentation aggregation</li>
    </ul>

    <h3>4. Core Microservices</h3>
    <ul>
      <li><strong>User Service</strong>: Authentication, authorization, LDAP integration, role management</li>
      <li><strong>Document Service</strong>: Document CRUD, version control, metadata management</li>
      <li><strong>Workflow Service</strong>: Dynamic workflow engine, approval routing, digital signatures</li>
      <li><strong>Report Service</strong>: Report generation, scheduling, export (PDF, Excel)</li>
      <li><strong>Notification Service</strong>: Email, SMS, Push notifications via RabbitMQ</li>
      <li><strong>Storage Service</strong>: File storage, S3-compatible storage, presigned URLs</li>
      <li><strong>Integration Service</strong>: VBDQ integration, LDAP sync, third-party APIs</li>
    </ul>

    <h3>5. Infrastructure Layer</h3>
    <ul>
      <li><strong>RabbitMQ</strong>: Event-driven messaging, async communication between services, Dead Letter Queue for reliability</li>
      <li><strong>Redis Cache</strong>: Distributed caching, session management, rate limiting</li>
      <li><strong>ELK Stack</strong>: Elasticsearch, Logstash, Kibana for centralized logging, tracing, and monitoring</li>
      <li><strong>Docker Swarm</strong>: Container orchestration, service discovery, load balancing, rolling updates</li>
      <li><strong>Database Cluster</strong>: SQL Server cluster with read/write replication, failover clustering</li>
      <li><strong>Storage Cluster</strong>: S3-compatible object storage with redundancy</li>
    </ul>

    <h3>6. Security Layer</h3>
    <ul>
      <li><strong>LDAP Integration</strong>: Unified authentication across government agencies</li>
      <li><strong>Digital Signature (Ky So)</strong>: Hardware Security Module (HSM) for document signing, PDF signature verification</li>
      <li><strong>Role-Based Access Control</strong>: Fine-grained permissions per document type and agency</li>
    </ul>

    <h2>Technology Stack</h2>
    <table>
      <tr><th>Component</th><th>Technology</th></tr>
      <tr><td>Backend Framework</td><td>.NET, C#</td></tr>
      <tr><td>API Gateway</td><td>Ocelot</td></tr>
      <tr><td>Load Balancer</td><td>NGINX</td></tr>
      <tr><td>Message Queue</td><td>RabbitMQ</td></tr>
      <tr><td>Distributed Cache</td><td>Redis</td></tr>
      <tr><td>Logging & Monitoring</td><td>ELK Stack (Elasticsearch, Logstash, Kibana)</td></tr>
      <tr><td>Container Orchestration</td><td>Docker Swarm</td></tr>
      <tr><td>Database</td><td>SQL Server (Cluster)</td></tr>
      <tr><td>Object Storage</td><td>S3-Compatible (MinIO/AWS S3)</td></tr>
      <tr><td>Authentication</td><td>LDAP, JWT</td></tr>
      <tr><td>Digital Signature</td><td>HSM, PDF Signature</td></tr>
      <tr><td>Health Monitoring</td><td>Prometheus, Health Checks</td></tr>
    </table>

    <h2>Key Highlights</h2>
    <ol>
      <li><strong>Microservices Architecture</strong>: 7 independent services, each with its own database</li>
      <li><strong>Event-Driven Communication</strong>: RabbitMQ for async messaging, ensuring loose coupling</li>
      <li><strong>High Availability</strong>: Docker Swarm with replicated containers, database clustering</li>
      <li><strong>Centralized Logging</strong>: ELK Stack for log aggregation, search, and visualization</li>
      <li><strong>Security by Design</strong>: LDAP integration, HSM-based digital signatures, JWT tokens</li>
      <li><strong>Scalability</strong>: Horizontal scaling per service based on load</li>
      <li><strong>Observability</strong>: Health checks, Prometheus metrics, distributed tracing</li>
    </ol>

    <h2>Challenges Solved</h2>
    <ul>
      <li><strong>Multi-agency deployment</strong>: Multi-tenant architecture with LDAP-based authentication</li>
      <li><strong>Document integrity</strong>: HSM-based digital signatures ensure non-repudiation</li>
      <li><strong>High throughput</strong>: Redis caching + RabbitMQ for async processing handles 10,000+ concurrent users</li>
      <li><strong>Data consistency</strong>: Transactional Outbox Pattern ensures reliable event publishing</li>
    </ul>
    `,
  },
];

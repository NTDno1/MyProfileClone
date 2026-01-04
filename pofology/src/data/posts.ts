import { Post } from '@/types';

export const posts: Post[] = [
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
];

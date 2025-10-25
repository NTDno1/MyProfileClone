# Nguyễn Tiến Đạt - Backend Developer

## Thông tin cá nhân
- **Họ tên:** Nguyễn Tiến Đạt
- **Vị trí:** Backend Developer
- **Sinh nhật:** 19/11/2001
- **Địa chỉ:** Thanh Mỹ - Sơn Tây - Hà Nội
- **Email:** datt19112001@gmail.com
- **Điện thoại:** 098387462
- **GitHub:** https://github.com/NTDno1
- **LinkedIn:** https://www.linkedin.com/in/ntd1911
- **Facebook:** https://www.facebook.com/nguyen.tien.at.85731

## Mục tiêu nghề nghiệp
- IELTS 6.5 - 7.0
- Fullstack developer

## Kinh nghiệm làm việc

### VNR Software (1/2024 - Hiện tại)
**Vị trí:** Back-End Developer

**Mô tả:** Phát triển và triển khai ứng dụng ERP sử dụng .NET 9 và Angular, áp dụng kiến trúc CQRS và các thực hành DevOps hiện đại. Tích hợp Redis, RabbitMQ và SignalR để hỗ trợ giao tiếp thời gian thực, tin nhắn phân tán và xác thực đa thiết bị an toàn. Tối ưu hóa hiệu suất hệ thống với LINQ, stored procedures và background jobs sử dụng Quartz. Tích hợp AWS S3 để lưu trữ file và triển khai ứng dụng trên cả Windows (IIS) và Ubuntu (Docker, Docker Compose), đảm bảo tính khả dụng cao và khả năng mở rộng.

**Công nghệ:** .NET 9, PostgreSQL, Angular, Redis, RabbitMQ, SignalR, AWS S3, Docker/Docker Compose, Quartz.

**Thành tựu:**
- Thiết kế và triển khai xác thực dựa trên Redis để quản lý access tokens và ngăn chặn đăng nhập trái phép trên nhiều thiết bị.
- Tích hợp RabbitMQ và SignalR để xử lý background jobs và đẩy thông báo thời gian thực đến người dùng.
- Sử dụng Quartz để lên lịch và thực thi các tác vụ nền (công việc định kỳ và đồng bộ hóa dữ liệu).
- Cải thiện hiệu suất bằng cách áp dụng LINQ để thao tác dữ liệu và stored procedures cho các truy vấn phức tạp trong PostgreSQL.
- Triển khai và cấu hình AWS S3 để lưu trữ và quản lý file người dùng một cách an toàn.
- Triển khai hệ thống trên IIS (Windows) và Docker/Docker Compose (Ubuntu), cho phép môi trường linh hoạt và nhất quán trên staging và production.

### HOP LONG TECH (08/2022 - 12/2023)
**Vị trí:** Fullstack Developer

**Mô tả:** Có kinh nghiệm phát triển các hệ thống doanh nghiệp có thể mở rộng sử dụng .NET và các mẫu kiến trúc hiện đại. Thành công trong việc cung cấp các giải pháp ERP và tích hợp với trọng tâm mạnh mẽ về hiệu suất, khả năng bảo trì và kiến trúc sạch.

**Công nghệ:** .NET, SQL Server, AngularJS, Dapper, LINQ.

**Thành tựu:**
- Sử dụng Dapper và LINQ để truy cập và thao tác dữ liệu hiệu quả, tối ưu hóa các truy vấn cơ sở dữ liệu, giảm thời gian phản hồi và cải thiện thông lượng.
- Thiết kế và phát triển các tính năng báo cáo có thể cấu hình phù hợp với nhiều phòng ban.
- Xây dựng các module frontend phản hồi và thân thiện với người dùng bằng AngularJS, đảm bảo tương tác mượt mà và cập nhật thời gian thực trên các module ERP.
- Đảm bảo tính ổn định và độ tin cậy cao của hệ thống trong quá trình sử dụng hàng ngày bằng cách áp dụng các nguyên tắc kiến trúc sạch và tối ưu hóa hiệu suất.

## Dự án cá nhân

### E-Commerce Platform
**GitHub:** https://github.com/NTDno1/BaseProject

**Công nghệ:**
- Core, Data: .NET 9, C# 13, ASP.NET Core, EF Core, PostgreSQL
- Patterns: Clean Architecture, CQRS
- Utilities: FluentValidation, AutoMapper, Serilog

**Mô tả:** Đây là một nền tảng thương mại điện tử mạnh mẽ được xây dựng với .NET 9, sử dụng ASP.NET Core, Entity Framework Core và MediatR. Nó tuân theo các mẫu thiết kế Clean Architecture và CQRS để có khả năng mở rộng và bảo trì. Các tính năng chính bao gồm xác thực người dùng an toàn với JWT, quản lý sản phẩm toàn diện và xác thực mạnh mẽ với FluentValidation. Dự án sử dụng PostgreSQL để lưu trữ dữ liệu, tích hợp logging và xử lý lỗi toàn diện, và hỗ trợ unit testing và integration testing để đảm bảo độ tin cậy. Nó được thiết kế để xử lý các môi trường có lưu lượng truy cập cao với trọng tâm mạnh mẽ về bảo mật và tối ưu hóa hiệu suất.

### System Integration với E-commerce Platform
**Mô tả:** Xây dựng từ đầu một dịch vụ middleware để tích hợp TikTok platform APIs và đồng bộ hóa dữ liệu với hệ thống ERP. Giải pháp được thiết kế dựa trên kiến trúc cơ sở và triển khai sử dụng Kiến trúc Ba lớp (Presentation, Business Logic, Data Access) để đảm bảo khả năng mở rộng, bảo trì và khả năng mở rộng cho các nền tảng thương mại điện tử trong tương lai.

**Công nghệ:** .NET, SQL Server

**Thành tựu:**
- Xây dựng tích hợp API hai chiều với TikTok, tận dụng hỗ trợ webhook để đồng bộ hóa thời gian thực đơn hàng, hàng tồn kho và dữ liệu khách hàng.
- Tự động hóa các quy trình ETL để đảm bảo thu thập chính xác và kịp thời dữ liệu marketing và bán hàng trên nhiều nền tảng.
- Phát triển pipeline dữ liệu Facebook Ads, trích xuất và chuyển đổi thông tin chiến dịch, báo cáo hiệu suất quảng cáo, doanh thu và số liệu chi phí để báo cáo ERP hợp nhất.
- Triển khai pipeline dữ liệu Facebook Ads để trích xuất, chuyển đổi và tải các số liệu hiệu suất chiến dịch vào hệ thống ERP.

## Học vấn

### Cử nhân (09-2019 - 09-2024)
- **Trường:** FPT University
- **Chuyên ngành:** Software Engineer

### Thạc sĩ (07-2025 - 07-2027)
- **Trường:** PTIT University
- **Chuyên ngành:** Information System (IS)

## Kỹ năng
- .NET, SQL, Problem Solving, Ability to Learn
- Clean Architecture, CQRS
- Entity Framework Core, LINQ
- Redis, RabbitMQ, SignalR
- Docker, Docker Compose
- AWS S3
- PostgreSQL, SQL Server
- Angular, AngularJS

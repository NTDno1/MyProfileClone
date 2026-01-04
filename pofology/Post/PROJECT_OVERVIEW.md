# Tổng Quan Dự Án: DemoCICD (BaseProject)

## 1. Giới Thiệu
Dự án này là một ứng dụng **ASP.NET Core Web API** được xây dựng theo kiến trúc **Clean Architecture** (hoặc Onion Architecture). Mục tiêu của dự án là cung cấp một cấu trúc nền tảng (Base Project) mẫu mực, tích hợp các thực hành tốt nhất (Best Practices) như CQRS, Dependency Injection, Logging và API Versioning.

## 2. Công Nghệ & Thư Viện Chính (Tech Stack)
*   **Core Framework**: .NET (ASP.NET Core 6/7/8)
*   **Kiến trúc**: Clean Architecture
*   **Xử lý Logic**: MediatR (triển khai mẫu CQRS)
*   **Data Access (ORM)**:
    *   **Entity Framework Core**: Dùng cho các thao tác ghi (Command) và quản lý Schema, Migrations (`DemoCICD.Persistance`).
    *   **Dapper**: Dùng cho các thao tác đọc (Query) hiệu năng cao (`DemoCICD.Infrastructure.Dapper`).
*   **API & Routing**:
    *   Controllers (truyền thống)
    *   Minimal APIs (sử dụng thư viện **Carter**)
*   **Validation**: FluentValidation
*   **Mapping**: AutoMapper
*   **Logging**: Serilog
*   **Documentation**: Swagger (Swashbuckle) với hỗ trợ API Versioning

## 3. Cấu Trúc Dự Án (Project Structure)
Dự án được tổ chức trong thư mục `src` với các tầng (layer) rõ ràng:

### 3.1. DemoCICD.API
*   **Vai trò**: Entry point của ứng dụng.
*   **Thành phần**:
    *   `Program.cs`: Cấu hình DI container, Middleware, Swagger, Serilog.
    *   `Middleware`: Chứa `ExceptionHandlingMiddleware` để xử lý lỗi tập trung.
    *   Cấu hình `appsettings.json`.

### 3.2. DemoCICD.Core (Domain & Application)
Lõi của ứng dụng, không phụ thuộc vào công nghệ bên ngoài.

*   **DemoCICD.Domain**:
    *   Chứa các **Entities**: `Product`, `Identity`.
    *   Định nghĩa các Interface cho Repository.
*   **DemoCICD.Application**:
    *   Chứa logic nghiệp vụ.
    *   **UserCases**: Áp dụng CQRS (Command/Query).
    *   **Mapper**: AutoMapper Profile.
    *   **DependencyInjection**: Đăng ký dịch vụ Application.

### 3.3. DemoCICD.Infrastructure Layer
Giao tiếp với dịch vụ bên ngoài và Database.

*   **DemoCICD.Persistance**:
    *   EF Core `ApplicationDbContext`.
    *   Migrations và Repositories.
*   **DemoCICD.Infrastructure.Dapper**:
    *   Truy vấn dữ liệu hiệu năng cao với Dapper.

### 3.4. DemoCICD.Presentation
*   **Vai trò**: Tách biệt logic trình bày khỏi API chính.
*   **Thành phần**: `AssemblyReference.cs` để map Controller/Endpoint.

## 4. Các Tính Năng & Patterns Nổi Bật
1.  **CQRS**: Tách biệt luồng Ghi và Đọc.
2.  **Global Exception Handling**: Xử lý lỗi tập trung.
3.  **API Versioning**: Hỗ trợ versioning cho API.
4.  **Swagger**: Tài liệu hóa API tự động.
5.  **Hybrid Data Access**: Kết hợp EF Core và Dapper.

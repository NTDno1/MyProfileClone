import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.experience': 'Experience',
    'nav.services': 'Services',
    'nav.works': 'Works',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    
    // Hero Section
    'hero.title': "I'm a",
    'hero.hire': 'Hire Me',
    'hero.scroll': 'Scroll Down',
    
    // About Section
    'about.title': 'About Me',
    'about.description': 'Hi, I am Nguyễn Tiến Đạt, I am a backend developer specializing in designing secure and efficient systems using languages like C#, and databases like SQL Server. Passionate about problem-solving and learning new technologies, I always aim for optimal and sustainable solutions. I work from Thanh Mỹ - Sơn Tây - Hà Nội, Vietnam.',
    'about.download': 'Download CV',
    'about.view': 'View CV',
    'about.projects': 'Projects Completed',
    'about.coffee': 'Cup of Coffee',
    'about.clients': 'Satisfied clients',
    'about.experience': 'Years of experience',
    
    // Experience Section
    'experience.title': 'Experience',
    'experience.vnr.title': 'Back-End Developer',
    'experience.vnr.company': 'VNR Software',
    'experience.vnr.period': 'Jan 2024 - Present',
    'experience.vnr.description': 'Developed and deployed an ERP application using .NET 9 and Angular, implementing CQRS architecture and modern DevOps practices. Integrated Redis, RabbitMQ and SignalR to enable real-time communication, distributed messaging and secure multi-device authentication. Optimized system performance with LINQ, stored procedures and background jobs using Quartz. Integrated AWS S3 for file storage and deployed the application on both Windows (IIS) and Ubuntu (Docker, Docker Compose), ensuring high availability and scalability.',
    
    'experience.hoplong.title': 'Fullstack Developer',
    'experience.hoplong.company': 'HOP LONG TECH',
    'experience.hoplong.period': 'Aug 2022 - Dec 2023',
    'experience.hoplong.description': 'Experienced in developing scalable enterprise systems using .NET and modern architectural patterns. Successfully delivered ERP and integration solutions with a strong focus on performance, maintainability, and clean architecture. Led the development and maintenance of a full-scale ERP application covering key business modules such as Finance, Supply Chain, Inventory, HR, and CRM.',
    
    // Education Section
    'education.title': 'Education',
    'education.bachelor.degree': 'Bachelor of Software Engineering',
    'education.bachelor.school': 'FPT University',
    'education.bachelor.period': 'Sep 2019 - Sep 2024',
    'education.bachelor.description': 'Studied Software Engineering with focus on modern development practices, system design, and software architecture.',
    
    'education.master.degree': 'Master of Information System',
    'education.master.school': 'PTIT University',
    'education.master.period': 'Jul 2025 - Jul 2027',
    'education.master.description': 'Pursuing Master degree in Information System to deepen knowledge in enterprise systems and data management.',
    
    // Services Section
    'services.title': 'Services',
    'services.backend.name': 'Backend Development',
    'services.backend.description': 'Design and develop secure, scalable backend systems using .NET, C#, and modern architectural patterns like Clean Architecture and CQRS.',
    'services.database.name': 'Database Design',
    'services.database.description': 'Expert in SQL Server database design, optimization, and management. Experienced with Entity Framework Core and LINQ for efficient data access.',
    'services.integration.name': 'System Integration',
    'services.integration.description': 'Build middleware services and API integrations for e-commerce platforms, ERP systems, and third-party services with real-time synchronization.',
    'services.custom': 'Looking for a custom service?',
    'services.contact': 'Click here to contact me!',
    
    // Works Section
    'works.title': 'Recent Works',
    'works.view': 'View All',
    
    // Contact Section
    'contact.title': 'Get In Touch',
    'contact.description': "Don't like forms? Send me an email. 👋",
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.location': 'Location',
    'contact.github': 'GitHub',
    'contact.linkedin': 'LinkedIn',
    'contact.facebook': 'Facebook',
    'contact.talk': "Let's talk about everything!",
    
    // Contact Page
    'contact.page.title': 'Contact Me',
    'contact.page.breadcrumb.home': 'Home',
    'contact.page.breadcrumb.contact': 'Contact',
    'contact.page.form.name': 'Your Name',
    'contact.page.form.email': 'Email Address',
    'contact.page.form.subject': 'Subject',
    'contact.page.form.message': 'Message',
    'contact.page.form.submit': 'Send Message',
    'contact.page.address': 'Address',
    'contact.page.social': 'Social Media',
    'contact.page.greeting': "Don't like forms? Send me an email. 👋",
    
    // CV Page
    'cv.name': 'Nguyễn Tiến Đạt',
    'cv.position': 'Backend Developer',
    'cv.aboutMe.title': 'ABOUT ME',
    'cv.aboutMe.content': 'I am a backend developer specializing in designing secure and efficient systems using languages like C#, and databases like SQL Server. Passionate about problem-solving and learning new technologies, I always aim for optimal and sustainable solutions.',
    'cv.skills.title': 'SKILLS',
    'cv.education.title': 'EDUCATION',
    'cv.education.bachelor': 'BACHELOR',
    'cv.education.master': 'Master',
    'cv.education.bachelor.school': 'FPT University',
    'cv.education.bachelor.major': 'Software Engineer',
    'cv.education.master.school': 'PTIT University',
    'cv.education.master.major': 'Information System (IS)',
    'cv.futureGoals.title': 'FUTURE GOALS',
    'cv.futureGoals.ielts': 'IELTS 6.5 - 7.0',
    'cv.futureGoals.fullstack': 'Fullstack developer',
    'cv.workExperience.title': 'WORK EXPERIENCE',
    'cv.workExperience.overview': 'Overview',
    'cv.workExperience.description': 'Description:',
    'cv.workExperience.techStack': 'Tech Stack:',
    'cv.workExperience.achievements': 'Achievements:',
    'cv.vnr.position': 'Back-End Developer',
    'cv.vnr.period': '1/2024 - Now',
    'cv.vnr.overview1': 'Developed and deployed an ERP application using .NET 9 and Angular, implementing CQRS architecture and modern DevOps practices. Integrated Redis, RabbitMQ and SignalR to enable real-time communication, distributed messaging and secure multi-device authentication.',
    'cv.vnr.overview2': 'Optimized system performance with LINQ, stored procedures and background jobs using Quartz. Integrated AWS S3 for file storage and deployed the application on both Windows (IIS) and Ubuntu (Docker, Docker Compose), ensuring high availability and scalability.',
    'cv.vnr.project1.title': '1. ERP System — V2 (Enterprise Resource Planning)',
    'cv.vnr.project1.description': 'Contributed to the development and maintenance of an enterprise-level ERP system designed to manage finance, inventory, supply chain and HR modules across multiple departments. The project focused on modernizing the existing system by applying CQRS, improving deployment strategy, and adding real-time communication and distributed processing components.',
    'cv.vnr.project1.techStack': '.NET 9, PostgreSQL, Angular, Redis, RabbitMQ, SignalR, AWS S3, Docker/Docker Compose, Quartz.',
    'cv.vnr.project1.achievement1': 'Designed and implemented Redis-based authentication to manage access tokens and prevent unauthorized logins across multiple devices.',
    'cv.vnr.project1.achievement2': 'Integrated RabbitMQ and SignalR to process background jobs and push real-time notifications to users.',
    'cv.vnr.project1.achievement3': 'Used Quartz to schedule and execute background tasks (periodic jobs and data synchronization).',
    'cv.vnr.project1.achievement4': 'Improved performance by applying LINQ for data manipulation and stored procedures for complex queries in PostgreSQL.',
    'cv.vnr.project1.achievement5': 'Implemented and configured AWS S3 to securely store and manage user files.',
    'cv.vnr.project1.achievement6': 'Deployed the system on IIS (Windows) and Docker/Docker Compose (Ubuntu), enabling flexible and consistent environments across staging and production.',
    'cv.hoplong.position': 'Fullstack Developer',
    'cv.hoplong.period': '08/2022 - 12/2023',
    'cv.hoplong.overview': 'Experienced in developing scalable enterprise systems using .NET and modern architectural patterns. Successfully delivered ERP and integration solutions with a strong focus on performance, maintainability, and clean architecture.',
    'cv.hoplong.project1.title': '1. ERP System',
    'cv.hoplong.project1.description': 'Led the development and maintenance of a full-scale ERP application covering key business modules such as Finance, Supply Chain, Inventory, HR, and CRM. The project was developed following the MVC architectural model, with a strong focus on scalability, maintainability, and performance.',
    'cv.hoplong.project1.techStack': '.NET, SQL Server, AngularJS.',
    'cv.hoplong.project1.achievement1': 'Utilized Dapper and LINQ for efficient data access and manipulation, optimizing database queries → reduced response time and improved throughput.',
    'cv.hoplong.project1.achievement2': 'Designed and developed configurable reporting features tailored to multiple departments.',
    'cv.hoplong.project1.achievement3': 'Built responsive and user-friendly frontend modules with AngularJS, ensuring smooth interaction and real-time updates across ERP modules.',
    'cv.hoplong.project1.achievement4': 'Ensured high system stability and reliability during daily operational use by applying clean architecture principles and performance tuning.',
    'cv.hoplong.project2.title': '2. System connect with Ecomerce platform',
    'cv.hoplong.project2.description': 'Built from scratch a middleware service to integrate TikTok platform APIs and synchronize data with the ERP system. The solution was designed based on my base architecture and implemented using a Three-Layer Architecture (Presentation, Business Logic, Data Access) to ensure extensibility, maintainability, and scalability for future e-commerce platforms.',
    'cv.hoplong.project2.techStack': '.NET, SQL Server',
    'cv.hoplong.project2.achievement1': 'Built a bi-directional API integration with TikTok, leveraging webhook support for real-time synchronization of orders, inventory, and customer data.',
    'cv.hoplong.project2.achievement2': 'Automated ETL workflows to ensure accurate and timely ingestion of marketing and sales data across multiple platforms.',
    'cv.hoplong.project2.achievement3': 'Developed a Facebook Ads data pipeline, extracting and transforming campaign insights, ad performance reports, revenue, and cost metrics for consolidated ERP reporting.',
    'cv.hoplong.project2.achievement4': 'Implemented a Facebook Ads data pipeline to extract, transform, and load campaign performance metrics into the ERP system.',
    'cv.personalProject.title': 'PERSONAL PROJECT',
    'cv.personalProject.ecommerce.title': 'E-Commerce Project',
    'cv.personalProject.ecommerce.techStack': 'Core, Data: .NET 9, C# 13, ASP.NET Core, EF Core, PostgreSQL.',
    'cv.personalProject.ecommerce.patterns': 'Patterns: Clean Architecture, CQRS.',
    'cv.personalProject.ecommerce.utilities': 'Utilities: FluentValidation, AutoMapper, Serilog.',
    'cv.personalProject.ecommerce.description': 'This is a robust e-commerce platform built with .NET 9, utilizing ASP.NET Core, Entity Framework Core, and MediatR. It follows Clean Architecture and CQRS design patterns for scalability and maintainability. Key features include secure user authentication with JWT, comprehensive product management, and robust validation with FluentValidation. The project use PostgreSQL for data storage, integrates extensive logging and error handling, and supports unit and integration testing for reliability. It is designed to handle high-traffic environments with a strong focus on security and performance optimization.',
  },
  vi: {
    // Navigation
    'nav.home': 'Trang chủ',
    'nav.about': 'Giới thiệu',
    'nav.experience': 'Kinh nghiệm',
    'nav.services': 'Dịch vụ',
    'nav.works': 'Dự án',
    'nav.blog': 'Blog',
    'nav.contact': 'Liên hệ',
    
    // Hero Section
    'hero.title': 'Tôi là',
    'hero.hire': 'Thuê tôi',
    'hero.scroll': 'Cuộn xuống',
    
    // About Section
    'about.title': 'Giới thiệu',
    'about.description': 'Xin chào, tôi là Nguyễn Tiến Đạt, tôi là một backend developer chuyên thiết kế các hệ thống bảo mật và hiệu quả sử dụng các ngôn ngữ như C# và cơ sở dữ liệu như SQL Server. Đam mê giải quyết vấn đề và học hỏi công nghệ mới, tôi luôn hướng tới các giải pháp tối ưu và bền vững. Tôi làm việc tại Thanh Mỹ - Sơn Tây - Hà Nội, Việt Nam.',
    'about.download': 'Tải CV',
    'about.view': 'Xem CV',
    'about.projects': 'Dự án đã hoàn thành',
    'about.coffee': 'Cốc cà phê',
    'about.clients': 'Khách hàng hài lòng',
    'about.experience': 'Năm kinh nghiệm',
    
    // Experience Section
    'experience.title': 'Kinh nghiệm',
    'experience.vnr.title': 'Back-End Developer',
    'experience.vnr.company': 'VNR Software',
    'experience.vnr.period': 'Tháng 1/2024 - Hiện tại',
    'experience.vnr.description': 'Phát triển và triển khai ứng dụng ERP sử dụng .NET 9 và Angular, áp dụng kiến trúc CQRS và các thực hành DevOps hiện đại. Tích hợp Redis, RabbitMQ và SignalR để hỗ trợ giao tiếp thời gian thực, tin nhắn phân tán và xác thực đa thiết bị an toàn. Tối ưu hóa hiệu suất hệ thống với LINQ, stored procedures và background jobs sử dụng Quartz. Tích hợp AWS S3 để lưu trữ file và triển khai ứng dụng trên cả Windows (IIS) và Ubuntu (Docker, Docker Compose), đảm bảo tính khả dụng cao và khả năng mở rộng.',
    
    'experience.hoplong.title': 'Fullstack Developer',
    'experience.hoplong.company': 'HOP LONG TECH',
    'experience.hoplong.period': 'Tháng 8/2022 - Tháng 12/2023',
    'experience.hoplong.description': 'Có kinh nghiệm phát triển các hệ thống doanh nghiệp có thể mở rộng sử dụng .NET và các mẫu kiến trúc hiện đại. Thành công trong việc cung cấp các giải pháp ERP và tích hợp với trọng tâm mạnh mẽ về hiệu suất, khả năng bảo trì và kiến trúc sạch. Dẫn đầu việc phát triển và bảo trì ứng dụng ERP toàn diện bao gồm các module kinh doanh chính như Tài chính, Chuỗi cung ứng, Hàng tồn kho, Nhân sự và CRM.',
    
    // Education Section
    'education.title': 'Học vấn',
    'education.bachelor.degree': 'Cử nhân Kỹ thuật Phần mềm',
    'education.bachelor.school': 'Đại học FPT',
    'education.bachelor.period': 'Tháng 9/2019 - Tháng 9/2024',
    'education.bachelor.description': 'Học tập Kỹ thuật Phần mềm với trọng tâm vào các thực hành phát triển hiện đại, thiết kế hệ thống và kiến trúc phần mềm.',
    
    'education.master.degree': 'Thạc sĩ Hệ thống Thông tin',
    'education.master.school': 'Đại học PTIT',
    'education.master.period': 'Tháng 7/2025 - Tháng 7/2027',
    'education.master.description': 'Theo học bằng Thạc sĩ Hệ thống Thông tin để nâng cao kiến thức về hệ thống doanh nghiệp và quản lý dữ liệu.',
    
    // Services Section
    'services.title': 'Dịch vụ',
    'services.backend.name': 'Phát triển Backend',
    'services.backend.description': 'Thiết kế và phát triển các hệ thống backend bảo mật, có thể mở rộng sử dụng .NET, C# và các mẫu kiến trúc hiện đại như Clean Architecture và CQRS.',
    'services.database.name': 'Thiết kế Cơ sở dữ liệu',
    'services.database.description': 'Chuyên gia trong thiết kế, tối ưu hóa và quản lý cơ sở dữ liệu SQL Server. Có kinh nghiệm với Entity Framework Core và LINQ để truy cập dữ liệu hiệu quả.',
    'services.integration.name': 'Tích hợp Hệ thống',
    'services.integration.description': 'Xây dựng các dịch vụ middleware và tích hợp API cho các nền tảng thương mại điện tử, hệ thống ERP và dịch vụ bên thứ ba với đồng bộ hóa thời gian thực.',
    'services.custom': 'Tìm kiếm dịch vụ tùy chỉnh?',
    'services.contact': 'Nhấp vào đây để liên hệ với tôi!',
    
    // Works Section
    'works.title': 'Dự án gần đây',
    'works.view': 'Xem tất cả',
    
    // Contact Section
    'contact.title': 'Liên hệ',
    'contact.description': 'Không thích form? Gửi email cho tôi. 👋',
    'contact.email': 'Email',
    'contact.phone': 'Điện thoại',
    'contact.location': 'Địa chỉ',
    'contact.github': 'GitHub',
    'contact.linkedin': 'LinkedIn',
    'contact.facebook': 'Facebook',
    'contact.talk': 'Hãy nói chuyện về mọi thứ!',
    
    // Contact Page
    'contact.page.title': 'Liên hệ với tôi',
    'contact.page.breadcrumb.home': 'Trang chủ',
    'contact.page.breadcrumb.contact': 'Liên hệ',
    'contact.page.form.name': 'Tên của bạn',
    'contact.page.form.email': 'Địa chỉ email',
    'contact.page.form.subject': 'Chủ đề',
    'contact.page.form.message': 'Nội dung tin nhắn',
    'contact.page.form.submit': 'Gửi tin nhắn',
    'contact.page.address': 'Địa chỉ',
    'contact.page.social': 'Mạng xã hội',
    'contact.page.greeting': 'Tôi rất mong được nghe từ bạn. 👋',
    
    // CV Page
    'cv.name': 'Nguyễn Tiến Đạt',
    'cv.position': 'Backend Developer',
    'cv.aboutMe.title': 'GIỚI THIỆU',
    'cv.aboutMe.content': 'Tôi là một backend developer chuyên thiết kế các hệ thống bảo mật và hiệu quả sử dụng các ngôn ngữ như C# và cơ sở dữ liệu như SQL Server. Đam mê giải quyết vấn đề và học hỏi công nghệ mới, tôi luôn hướng tới các giải pháp tối ưu và bền vững.',
    'cv.skills.title': 'KỸ NĂNG',
    'cv.education.title': 'HỌC VẤN',
    'cv.education.bachelor': 'CỬ NHÂN',
    'cv.education.master': 'Thạc sĩ',
    'cv.education.bachelor.school': 'Đại học FPT',
    'cv.education.bachelor.major': 'Kỹ thuật phần mềm',
    'cv.education.master.school': 'Đại học PTIT',
    'cv.education.master.major': 'Hệ thống thông tin (IS)',
    'cv.futureGoals.title': 'MỤC TIÊU TƯƠNG LAI',
    'cv.futureGoals.ielts': 'IELTS 6.5 - 7.0',
    'cv.futureGoals.fullstack': 'Fullstack developer',
    'cv.workExperience.title': 'KINH NGHIỆM LÀM VIỆC',
    'cv.workExperience.overview': 'Tổng quan',
    'cv.workExperience.description': 'Mô tả:',
    'cv.workExperience.techStack': 'Công nghệ:',
    'cv.workExperience.achievements': 'Thành tựu:',
    'cv.vnr.position': 'Back-End Developer',
    'cv.vnr.period': '1/2024 - Hiện tại',
    'cv.vnr.overview1': 'Phát triển và triển khai ứng dụng ERP sử dụng .NET 9 và Angular, áp dụng kiến trúc CQRS và các thực hành DevOps hiện đại. Tích hợp Redis, RabbitMQ và SignalR để hỗ trợ giao tiếp thời gian thực, tin nhắn phân tán và xác thực đa thiết bị an toàn.',
    'cv.vnr.overview2': 'Tối ưu hóa hiệu suất hệ thống với LINQ, stored procedures và background jobs sử dụng Quartz. Tích hợp AWS S3 để lưu trữ file và triển khai ứng dụng trên cả Windows (IIS) và Ubuntu (Docker, Docker Compose), đảm bảo tính khả dụng cao và khả năng mở rộng.',
    'cv.vnr.project1.title': '1. Hệ thống ERP — V2 (Hoạch định Nguồn lực Doanh nghiệp)',
    'cv.vnr.project1.description': 'Đóng góp vào việc phát triển và bảo trì hệ thống ERP cấp doanh nghiệp được thiết kế để quản lý các module tài chính, hàng tồn kho, chuỗi cung ứng và nhân sự trên nhiều phòng ban. Dự án tập trung vào việc hiện đại hóa hệ thống hiện có bằng cách áp dụng CQRS, cải thiện chiến lược triển khai và thêm các thành phần giao tiếp thời gian thực và xử lý phân tán.',
    'cv.vnr.project1.techStack': '.NET 9, PostgreSQL, Angular, Redis, RabbitMQ, SignalR, AWS S3, Docker/Docker Compose, Quartz.',
    'cv.vnr.project1.achievement1': 'Thiết kế và triển khai xác thực dựa trên Redis để quản lý access tokens và ngăn chặn đăng nhập trái phép trên nhiều thiết bị.',
    'cv.vnr.project1.achievement2': 'Tích hợp RabbitMQ và SignalR để xử lý background jobs và đẩy thông báo thời gian thực đến người dùng.',
    'cv.vnr.project1.achievement3': 'Sử dụng Quartz để lên lịch và thực thi các tác vụ nền (công việc định kỳ và đồng bộ hóa dữ liệu).',
    'cv.vnr.project1.achievement4': 'Cải thiện hiệu suất bằng cách áp dụng LINQ để thao tác dữ liệu và stored procedures cho các truy vấn phức tạp trong PostgreSQL.',
    'cv.vnr.project1.achievement5': 'Triển khai và cấu hình AWS S3 để lưu trữ và quản lý file người dùng một cách an toàn.',
    'cv.vnr.project1.achievement6': 'Triển khai hệ thống trên IIS (Windows) và Docker/Docker Compose (Ubuntu), cho phép môi trường linh hoạt và nhất quán trên staging và production.',
    'cv.hoplong.position': 'Fullstack Developer',
    'cv.hoplong.period': '08/2022 - 12/2023',
    'cv.hoplong.overview': 'Có kinh nghiệm phát triển các hệ thống doanh nghiệp có thể mở rộng sử dụng .NET và các mẫu kiến trúc hiện đại. Thành công trong việc cung cấp các giải pháp ERP và tích hợp với trọng tâm mạnh mẽ về hiệu suất, khả năng bảo trì và kiến trúc sạch.',
    'cv.hoplong.project1.title': '1. Hệ thống ERP',
    'cv.hoplong.project1.description': 'Dẫn đầu việc phát triển và bảo trì ứng dụng ERP toàn diện bao gồm các module kinh doanh chính như Tài chính, Chuỗi cung ứng, Hàng tồn kho, Nhân sự và CRM. Dự án được phát triển theo mô hình kiến trúc MVC, với trọng tâm mạnh mẽ về khả năng mở rộng, bảo trì và hiệu suất.',
    'cv.hoplong.project1.techStack': '.NET, SQL Server, AngularJS.',
    'cv.hoplong.project1.achievement1': 'Sử dụng Dapper và LINQ để truy cập và thao tác dữ liệu hiệu quả, tối ưu hóa các truy vấn cơ sở dữ liệu → giảm thời gian phản hồi và cải thiện thông lượng.',
    'cv.hoplong.project1.achievement2': 'Thiết kế và phát triển các tính năng báo cáo có thể cấu hình phù hợp với nhiều phòng ban.',
    'cv.hoplong.project1.achievement3': 'Xây dựng các module frontend phản hồi và thân thiện với người dùng bằng AngularJS, đảm bảo tương tác mượt mà và cập nhật thời gian thực trên các module ERP.',
    'cv.hoplong.project1.achievement4': 'Đảm bảo tính ổn định và độ tin cậy cao của hệ thống trong quá trình sử dụng hàng ngày bằng cách áp dụng các nguyên tắc kiến trúc sạch và tối ưu hóa hiệu suất.',
    'cv.hoplong.project2.title': '2. Hệ thống kết nối với nền tảng Thương mại điện tử',
    'cv.hoplong.project2.description': 'Xây dựng từ đầu một dịch vụ middleware để tích hợp TikTok platform APIs và đồng bộ hóa dữ liệu với hệ thống ERP. Giải pháp được thiết kế dựa trên kiến trúc cơ sở và triển khai sử dụng Kiến trúc Ba lớp (Presentation, Business Logic, Data Access) để đảm bảo khả năng mở rộng, bảo trì và khả năng mở rộng cho các nền tảng thương mại điện tử trong tương lai.',
    'cv.hoplong.project2.techStack': '.NET, SQL Server',
    'cv.hoplong.project2.achievement1': 'Xây dựng tích hợp API hai chiều với TikTok, tận dụng hỗ trợ webhook để đồng bộ hóa thời gian thực đơn hàng, hàng tồn kho và dữ liệu khách hàng.',
    'cv.hoplong.project2.achievement2': 'Tự động hóa các quy trình ETL để đảm bảo thu thập chính xác và kịp thời dữ liệu marketing và bán hàng trên nhiều nền tảng.',
    'cv.hoplong.project2.achievement3': 'Phát triển pipeline dữ liệu Facebook Ads, trích xuất và chuyển đổi thông tin chiến dịch, báo cáo hiệu suất quảng cáo, doanh thu và số liệu chi phí để báo cáo ERP hợp nhất.',
    'cv.hoplong.project2.achievement4': 'Triển khai pipeline dữ liệu Facebook Ads để trích xuất, chuyển đổi và tải các số liệu hiệu suất chiến dịch vào hệ thống ERP.',
    'cv.personalProject.title': 'DỰ ÁN CÁ NHÂN',
    'cv.personalProject.ecommerce.title': 'Dự án Thương mại điện tử',
    'cv.personalProject.ecommerce.techStack': 'Core, Data: .NET 9, C# 13, ASP.NET Core, EF Core, PostgreSQL.',
    'cv.personalProject.ecommerce.patterns': 'Patterns: Clean Architecture, CQRS.',
    'cv.personalProject.ecommerce.utilities': 'Utilities: FluentValidation, AutoMapper, Serilog.',
    'cv.personalProject.ecommerce.description': 'Đây là một nền tảng thương mại điện tử mạnh mẽ được xây dựng với .NET 9, sử dụng ASP.NET Core, Entity Framework Core và MediatR. Nó tuân theo các mẫu thiết kế Clean Architecture và CQRS để có khả năng mở rộng và bảo trì. Các tính năng chính bao gồm xác thực người dùng an toàn với JWT, quản lý sản phẩm toàn diện và xác thực mạnh mẽ với FluentValidation. Dự án sử dụng PostgreSQL để lưu trữ dữ liệu, tích hợp logging và xử lý lỗi toàn diện, và hỗ trợ unit testing và integration testing để đảm bảo độ tin cậy. Nó được thiết kế để xử lý các môi trường có lưu lượng truy cập cao với trọng tâm mạnh mẽ về bảo mật và tối ưu hóa hiệu suất.',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

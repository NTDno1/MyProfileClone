import { FiGithub, FiExternalLink } from 'react-icons/fi';

const CVProjects = () => {
  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'Một nền tảng thương mại điện tử mạnh mẽ được xây dựng với .NET 9, sử dụng ASP.NET Core, Entity Framework Core và MediatR. Tuân theo các mẫu thiết kế Clean Architecture và CQRS để có khả năng mở rộng và bảo trì.',
      technologies: ['.NET 9', 'C# 13', 'ASP.NET Core', 'EF Core', 'PostgreSQL', 'CQRS', 'Clean Architecture', 'MediatR', 'FluentValidation', 'AutoMapper', 'Serilog'],
      highlights: [
        'Xác thực người dùng an toàn với JWT',
        'Quản lý sản phẩm toàn diện',
        'Xác thực mạnh mẽ với FluentValidation',
        'Logging và xử lý lỗi toàn diện',
        'Unit testing và Integration testing',
      ],
      github: 'https://github.com/NTDno1/BaseProject',
    },
    {
      title: 'System Integration với E-commerce Platform',
      description: 'Xây dựng từ đầu một dịch vụ middleware để tích hợp TikTok platform APIs và đồng bộ hóa dữ liệu với hệ thống ERP. Được thiết kế dựa trên kiến trúc Ba lớp (Presentation, Business Logic, Data Access).',
      technologies: ['.NET', 'SQL Server', 'TikTok API', 'Facebook Ads API', 'Webhook', 'ETL'],
      highlights: [
        'Tích hợp API hai chiều với TikTok',
        'Webhook để đồng bộ hóa thời gian thực',
        'Tự động hóa quy trình ETL',
        'Pipeline dữ liệu Facebook Ads',
        'Báo cáo hiệu suất quảng cáo tích hợp',
      ],
    },
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiGithub className="text-blue-600" />
        Dự án cá nhân
      </h3>
      
      <div className="space-y-6">
        {projects.map((project, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-xl font-semibold text-gray-800">{project.title}</h4>
              {project.github && (
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FiGithub className="w-5 h-5" />
                </a>
              )}
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">{project.description}</p>
            
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Công nghệ:</h5>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, techIndex) => (
                  <span 
                    key={techIndex}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Thành tựu:</h5>
              <ul className="space-y-1">
                {project.highlights.map((highlight, highlightIndex) => (
                  <li key={highlightIndex} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-1 flex-shrink-0">✓</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CVProjects;


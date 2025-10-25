import { FiCode, FiDatabase, FiServer, FiBox, FiCloud } from 'react-icons/fi';
import { SiDotnet, SiPostgresql, SiMicrosoftsqlserver, SiAngular, SiDocker, SiRedis, SiRabbitmq } from 'react-icons/si';

const CVSkills = () => {
  const skillCategories = [
    {
      title: 'Backend Development',
      icon: <FiServer className="text-blue-600" />,
      skills: [
        { name: '.NET (Core, 9)', level: 90, icon: <SiDotnet /> },
        { name: 'ASP.NET Core', level: 90 },
        { name: 'Entity Framework Core', level: 85 },
        { name: 'LINQ', level: 85 },
        { name: 'Dapper', level: 80 },
      ]
    },
    {
      title: 'Architecture & Patterns',
      icon: <FiCode className="text-purple-600" />,
      skills: [
        { name: 'Clean Architecture', level: 85 },
        { name: 'CQRS', level: 85 },
        { name: 'MediatR', level: 80 },
        { name: 'Repository Pattern', level: 85 },
      ]
    },
    {
      title: 'Databases',
      icon: <FiDatabase className="text-green-600" />,
      skills: [
        { name: 'PostgreSQL', level: 85, icon: <SiPostgresql /> },
        { name: 'SQL Server', level: 85, icon: <SiMicrosoftsqlserver /> },
        { name: 'Stored Procedures', level: 80 },
        { name: 'Query Optimization', level: 75 },
      ]
    },
    {
      title: 'Frontend Development',
      icon: <FiCode className="text-red-600" />,
      skills: [
        { name: 'Angular', level: 75, icon: <SiAngular /> },
        { name: 'AngularJS', level: 70 },
        { name: 'TypeScript', level: 75 },
        { name: 'HTML/CSS', level: 80 },
      ]
    },
    {
      title: 'DevOps & Cloud',
      icon: <FiCloud className="text-indigo-600" />,
      skills: [
        { name: 'Docker', level: 80, icon: <SiDocker /> },
        { name: 'Docker Compose', level: 80 },
        { name: 'AWS S3', level: 75 },
        { name: 'IIS', level: 70 },
      ]
    },
    {
      title: 'Message Queue & Cache',
      icon: <FiBox className="text-orange-600" />,
      skills: [
        { name: 'Redis', level: 80, icon: <SiRedis /> },
        { name: 'RabbitMQ', level: 75, icon: <SiRabbitmq /> },
        { name: 'SignalR', level: 75 },
        { name: 'Quartz', level: 70 },
      ]
    },
  ];

  const otherSkills = [
    'Problem Solving',
    'Quick Learner',
    'Team Collaboration',
    'Agile/Scrum',
    'Git/GitHub',
    'RESTful APIs',
    'JWT Authentication',
    'Unit Testing',
    'Integration Testing',
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiCode className="text-blue-600" />
        Kỹ năng
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {skillCategories.map((category, index) => (
          <div key={index} className="bg-gray-50 p-5 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {category.icon}
              {category.title}
            </h4>
            <div className="space-y-3">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      {skill.icon && <span className="text-gray-600">{skill.icon}</span>}
                      {skill.name}
                    </span>
                    <span className="text-xs text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Kỹ năng khác</h4>
        <div className="flex flex-wrap gap-2">
          {otherSkills.map((skill, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CVSkills;


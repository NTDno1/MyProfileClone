import { FiTarget } from 'react-icons/fi';

const CVGoals = () => {
  const goals = [
    {
      title: 'Ngắn hạn',
      items: [
        'Đạt IELTS 6.5 - 7.0 để nâng cao kỹ năng giao tiếp tiếng Anh',
        'Nâng cao kỹ năng Frontend để trở thành Fullstack Developer',
        'Tham gia các dự án lớn và phức tạp hơn với quy mô quốc tế',
      ]
    },
    {
      title: 'Dài hạn',
      items: [
        'Trở thành Senior Fullstack Developer trong 3-5 năm tới',
        'Nắm vững kiến trúc hệ thống phân tán và microservices',
        'Lãnh đạo team và mentoring cho các developer mới',
      ]
    }
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiTarget className="text-blue-600" />
        Mục tiêu nghề nghiệp
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100">
            <h4 className="text-lg font-semibold text-blue-800 mb-4">{goal.title}</h4>
            <ul className="space-y-3">
              {goal.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CVGoals;


import { Experience } from '@/types';
import { FiBriefcase, FiCalendar } from 'react-icons/fi';

interface CVExperienceProps {
  experiences: Experience[];
}

const CVExperience = ({ experiences }: CVExperienceProps) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiBriefcase className="text-blue-600" />
        Kinh nghiệm làm việc
      </h3>
      
      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <div key={index} className="border-l-4 border-blue-200 pl-6 relative">
            <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full"></div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">{exp.jobTitle}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="text-blue-600" />
                  <span>{exp.startDate} - {exp.endDate}</span>
                </div>
              </div>
              <h5 className="text-md font-medium text-blue-600 mb-3">{exp.company}</h5>
              <p className="text-gray-700 leading-relaxed">{exp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CVExperience;

import { Education } from '@/types';
import { FiBook, FiCalendar } from 'react-icons/fi';

interface CVEducationProps {
  educations: Education[];
}

const CVEducation = ({ educations }: CVEducationProps) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiBook className="text-blue-600" />
        Học vấn
      </h3>
      
      <div className="space-y-6">
        {educations.map((edu, index) => (
          <div key={index} className="border-l-4 border-green-200 pl-6 relative">
            <div className="absolute -left-2 top-0 w-4 h-4 bg-green-600 rounded-full"></div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">{edu.degree}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="text-green-600" />
                  <span>{edu.startDate} - {edu.endDate}</span>
                </div>
              </div>
              <h5 className="text-md font-medium text-green-600 mb-3">{edu.school}</h5>
              <p className="text-gray-700 leading-relaxed">{edu.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CVEducation;


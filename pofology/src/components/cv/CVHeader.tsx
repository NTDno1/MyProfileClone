import { FiMail, FiPhone, FiMapPin, FiCalendar, FiGithub, FiLinkedin, FiFacebook } from 'react-icons/fi';

const CVHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
      <h1 className="text-4xl font-bold mb-2">Nguyễn Tiến Đạt</h1>
      <h2 className="text-xl text-blue-100 mb-6">Backend Developer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center justify-center gap-2">
          <FiMail className="text-blue-200" />
          <span>datt19112001@gmail.com</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FiPhone className="text-blue-200" />
          <span>098387462</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FiMapPin className="text-blue-200" />
          <span>Thanh Mỹ - Sơn Tây - Hà Nội</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FiCalendar className="text-blue-200" />
          <span>19/11/2001</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FiGithub className="text-blue-200" />
          <a href="https://github.com/NTDno1" target="_blank" rel="noopener noreferrer" className="hover:text-blue-200">
            github.com/NTDno1
          </a>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FiLinkedin className="text-blue-200" />
          <a href="https://www.linkedin.com/in/ntd1911" target="_blank" rel="noopener noreferrer" className="hover:text-blue-200">
            linkedin.com/in/ntd1911
          </a>
        </div>
      </div>
    </div>
  );
};

export default CVHeader;

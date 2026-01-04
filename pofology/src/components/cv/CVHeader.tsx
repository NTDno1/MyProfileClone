import { FiMail, FiPhone, FiMapPin, FiGithub, FiFacebook, FiGlobe } from 'react-icons/fi';

const CVHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center print:p-1 print:pb-0.5 print-keep-together">
      <h1 className="text-4xl font-bold mb-1 print:text-base print:mb-0">Nguyễn Tiến Đạt</h1>
      <h2 className="text-xl text-blue-100 mb-2 print:text-[10px] print:mb-0">WEB DEVELOPER</h2>
      
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm print:text-[7px] print:gap-0.5 print:mt-0.5">
        <div className="flex items-center gap-2">
          <FiPhone className="text-blue-200" />
          <span>0983877462</span>
        </div>
        <div className="flex items-center gap-2">
          <FiMail className="text-blue-200" />
          <span>datt19112001@gmail.com</span>
        </div>
        <div className="flex items-center gap-2">
          <FiFacebook className="text-blue-200" />
          <a href="https://facebook.com/datntd01" target="_blank" rel="noopener noreferrer" className="hover:text-blue-200">
            facebook.com/datntd01
          </a>
        </div>
        <div className="flex items-center gap-2">
          <FiMapPin className="text-blue-200" />
          <span>Thanh Mỹ - Sơn Tây - Hà Nội</span>
        </div>
        <div className="flex items-center gap-2">
          <FiGlobe className="text-blue-200" />
          <a href="https://datnguyentien.publicvm.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-200">
            datnguyentien.publicvm.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default CVHeader;

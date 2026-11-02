import { useLanguage } from '@/contexts/LanguageContext';

const CVMainContent = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-6 md:p-8 print:p-1.5 print:pb-1">
      {/* Work Experience */}
      <section className="mb-5 print:mb-2">
        <h2 className="text-2xl print:text-base font-bold text-gray-800 mb-2 print:mb-1 uppercase">{t('cv.workExperience.title')}</h2>

        {/* MobiFoneIT */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.mobifoneit.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.mobifoneit.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.mobifoneit.position')}</h4>

          <div className="space-y-2 print:space-y-0">
            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.mobifoneit.project.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.arch')}</span> {t('cv.workExperience.mobifoneit.project.arch.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.ha')}</span> {t('cv.workExperience.mobifoneit.project.ha.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.storage')}</span> {t('cv.workExperience.mobifoneit.project.storage.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.api')}</span> {t('cv.workExperience.mobifoneit.project.api.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.workflow')}</span> {t('cv.workExperience.mobifoneit.project.workflow.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.reporting')}</span> {t('cv.workExperience.mobifoneit.project.reporting.content')}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.mobifoneit.project.phase2.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.gateway')}</span> {t('cv.workExperience.mobifoneit.project.phase2.gateway.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.services')}</span> {t('cv.workExperience.mobifoneit.project.phase2.services.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.infra')}</span> {t('cv.workExperience.mobifoneit.project.phase2.infra.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.security')}</span> {t('cv.workExperience.mobifoneit.project.phase2.security.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.monitoring')}</span> {t('cv.workExperience.mobifoneit.project.phase2.monitoring.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.mobifoneit.project.phase2.deployment')}</span> {t('cv.workExperience.mobifoneit.project.phase2.deployment.content')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AgileTech */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.agiletech.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.agiletech.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.agiletech.position')}</h4>

          <div className="space-y-2 print:space-y-0">
            <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.leadership')}</span> {t('cv.workExperience.agiletech.leadership.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.development')}</span> {t('cv.workExperience.agiletech.development.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.messaging')}</span> {t('cv.workExperience.agiletech.messaging.content')}</li>
              <li className="ml-4 print:ml-3">+ {t('cv.workExperience.agiletech.messaging.redis')}</li>
              <li className="ml-4 print:ml-3">+ {t('cv.workExperience.agiletech.messaging.rabbitmq')}</li>
              <li className="ml-4 print:ml-3">+ {t('cv.workExperience.agiletech.messaging.signalr')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.performance')}</span> {t('cv.workExperience.agiletech.performance.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.deployment')}</span> {t('cv.workExperience.agiletech.deployment.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.cicd')}</span> {t('cv.workExperience.agiletech.cicd.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.database')}</span> {t('cv.workExperience.agiletech.database.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.security')}</span> {t('cv.workExperience.agiletech.security.content')}</li>
              <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.devops')}</span> {t('cv.workExperience.agiletech.devops.content')}</li>
            </ul>
            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.agiletech.education.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.erp')}</span> {t('cv.workExperience.agiletech.education.erp.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.3layer')}</span> {t('cv.workExperience.agiletech.education.3layer.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.react')}</span> {t('cv.workExperience.agiletech.education.react.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.jwt')}</span> {t('cv.workExperience.agiletech.education.jwt.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.validation')}</span> {t('cv.workExperience.agiletech.education.validation.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.agiletech.education.mapping')}</span> {t('cv.workExperience.agiletech.education.mapping.content')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* HopLongTech */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.workExperience.hoplongtech.company')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">{t('cv.workExperience.hoplongtech.period')}</span>
          </div>
          <h4 className="text-base print:text-[10px] text-gray-600 mb-1 print:mb-0">{t('cv.workExperience.hoplongtech.position')}</h4>

          <div className="space-y-2 print:space-y-0">
            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.hoplongtech.erp.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• {t('cv.workExperience.hoplongtech.erp.content1')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.dapper')}</span> {t('cv.workExperience.hoplongtech.erp.dapper.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.optimization')}</span> {t('cv.workExperience.hoplongtech.erp.optimization.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.frontend')}</span> {t('cv.workExperience.hoplongtech.erp.frontend.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.stability')}</span> {t('cv.workExperience.hoplongtech.erp.stability.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.reporting')}</span> {t('cv.workExperience.hoplongtech.erp.reporting.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.auth')}</span> {t('cv.workExperience.hoplongtech.erp.auth.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.erp.crud')}</span> {t('cv.workExperience.hoplongtech.erp.crud.content')}</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold print:text-[10px] text-gray-800 mb-0 print:mb-0">{t('cv.workExperience.hoplongtech.ecommerce.title')}</h5>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.content1')}</span> {t('cv.workExperience.hoplongtech.ecommerce.content1.desc')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.arch')}</span> {t('cv.workExperience.hoplongtech.ecommerce.arch.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.tiktok')}</span> {t('cv.workExperience.hoplongtech.ecommerce.tiktok.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.facebook')}</span> {t('cv.workExperience.hoplongtech.ecommerce.facebook.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.etl')}</span> {t('cv.workExperience.hoplongtech.ecommerce.etl.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.webhook')}</span> {t('cv.workExperience.hoplongtech.ecommerce.webhook.content')}</li>
                <li>• <span className="font-semibold">{t('cv.workExperience.hoplongtech.ecommerce.inventory')}</span> {t('cv.workExperience.hoplongtech.ecommerce.inventory.content')}</li>
              </ul>
            </div>
          </div>
        </div>

      </section>

      <hr className="border-gray-300 my-3 print:my-1.5" />

      {/* Personal Project */}
      <section>
        <h2 className="text-2xl print:text-base font-bold text-gray-800 mb-2 print:mb-1 uppercase">{t('cv.projects.title')}</h2>

        {/* AI Platform - Personal Project */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.projects.aiPlatform.title')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">-</span>
          </div>
          <a
            href="https://github.com/NTDno1/AIEnterprise"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm print:text-[9px] text-blue-600 hover:underline mb-1 print:mb-0 block"
          >
            {t('cv.projects.baseStructure.link')} https://github.com/NTDno1/AIEnterprise
          </a>

          <div className="space-y-2 print:space-y-0">
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 font-semibold mb-0 print:mb-0">• {t('cv.projects.baseStructure.techStack')}</p>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>+ .NET 8, ASP.NET Core, Clean Architecture, CQRS, MediatR</li>
                <li>+ Next.js 14, React 18, TailwindCSS, Zustand</li>
                <li>+ PostgreSQL + pgvector, Redis, MinIO, Docker</li>
                <li>+ Ollama (llama3.2, nomic-embed-text), Multi-provider AI Gateway</li>
              </ul>
            </div>
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.aiPlatform.overview')}</span> {t('cv.projects.aiPlatform.overview.content')}
              </p>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.architecture')}</span> {t('cv.projects.aiPlatform.architecture.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.rag')}</span> {t('cv.projects.aiPlatform.rag.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.gateway')}</span> {t('cv.projects.aiPlatform.gateway.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.agent')}</span> {t('cv.projects.aiPlatform.agent.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.nl2sql')}</span> {t('cv.projects.aiPlatform.nl2sql.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.voice')}</span> {t('cv.projects.aiPlatform.voice.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.infra')}</span> {t('cv.projects.aiPlatform.infra.content')}</li>
                <li>• <span className="font-semibold">{t('cv.projects.aiPlatform.deploy')}</span> {t('cv.projects.aiPlatform.deploy.content')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Base Structure Project */}
        <div className="mb-4 print:mb-2">
          <div className="flex justify-between items-start mb-0 print:mb-0">
            <h3 className="text-xl print:text-sm font-bold text-gray-800">{t('cv.projects.baseStructure.title')}</h3>
            <span className="text-sm print:text-[9px] text-gray-600">-</span>
          </div>
          <a
            href="https://github.com/NTDno1/BaseProject"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm print:text-[9px] text-blue-600 hover:underline mb-1 print:mb-0 block"
          >
            {t('cv.projects.baseStructure.link')} https://github.com/NTDno1/BaseProject
          </a>

          <div className="space-y-2 print:space-y-0">
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 font-semibold mb-0 print:mb-0">• {t('cv.projects.baseStructure.techStack')}</p>
              <ul className="space-y-0 print:space-y-0 text-sm print:text-[9px] text-gray-700 ml-4 print:ml-3 leading-tight print:leading-[1.1]">
                <li>+ {t('cv.projects.baseStructure.techStack.core')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.patterns')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.utils')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.auth')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.api')}</li>
                <li>+ {t('cv.projects.baseStructure.techStack.testing')}</li>
              </ul>
            </div>
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.baseStructure.description')}</span> {t('cv.projects.baseStructure.description.content')}
              </p>
            </div>
            <div>
              <p className="text-sm print:text-[9px] text-gray-700 leading-tight print:leading-[1.1]">
                <span className="font-semibold">• {t('cv.projects.baseStructure.why')}</span> {t('cv.projects.baseStructure.why.content')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-right mt-4 print:mt-1">
      </div>
    </div>
  );
};

export default CVMainContent;

import { useTranslation } from 'react-i18next';
import { Award, Download, Printer } from 'lucide-react';

const mockCertificates = [] as const;

export default function CertificatesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('certificates.title')}</h1>
          <p className="text-gray-400">{t('dashboard.student.subtitle')}</p>
        </div>
      </div>

      {mockCertificates.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('certificates.title')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('dashboard.student.emptyDescription')}</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4">{t('certificates.certificateNumber')}</th>
                <th className="px-6 py-4">{t('courses.courseName')}</th>
                <th className="px-6 py-4">{t('certificates.issuedAt')}</th>
                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {mockCertificates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                    {t('certificates.title')}
                  </td>
                </tr>
              ) : (
                mockCertificates.map((certificate, idx) => (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="px-6 py-4 text-white">{certificate}</td>
                    <td className="px-6 py-4 text-gray-300">—</td>
                    <td className="px-6 py-4 text-gray-400">—</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-2 text-xs rounded-lg bg-white/10 text-white border border-white/10 hover:border-white/30">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-2 text-xs rounded-lg bg-white/10 text-white border border-white/10 hover:border-white/30">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

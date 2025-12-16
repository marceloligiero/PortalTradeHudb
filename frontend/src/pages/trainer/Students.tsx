import { useTranslation } from 'react-i18next';
import { Users, Mail, GraduationCap } from 'lucide-react';

const sampleStudents = [
  { id: 1, name: 'Inês Costa', email: 'ines.costa@santander.com', bank: 'PT', status: 'ACTIVE' },
  { id: 2, name: 'Carlos Alvarez', email: 'c.alvarez@santander.com', bank: 'ES', status: 'PENDING' },
];

export default function TrainerStudentsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{t('navigation.students')}</h1>
          <p className="text-gray-400">{t('dashboard.trainer.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-widest">
              <th className="px-6 py-4">{t('users.fullName')}</th>
              <th className="px-6 py-4">{t('users.email')}</th>
              <th className="px-6 py-4">{t('courses.bank')}</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sampleStudents.map((student) => (
              <tr key={student.id} className="border-t border-white/5">
                <td className="px-6 py-4 text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-red-500" />
                  {student.name}
                </td>
                <td className="px-6 py-4 text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {student.email}
                </td>
                <td className="px-6 py-4 text-gray-300">{student.bank}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${
                      student.status === 'ACTIVE'
                        ? 'border-green-400 text-green-300 bg-green-500/10'
                        : 'border-yellow-400 text-yellow-300 bg-yellow-500/10'
                    }`}
                  >
                    {student.status === 'ACTIVE' ? t('common.active') : t('admin.awaitingValidation')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 text-xs rounded-lg bg-white/10 text-white border border-white/10 hover:border-white/30">
                    {t('common.view') || 'Ver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

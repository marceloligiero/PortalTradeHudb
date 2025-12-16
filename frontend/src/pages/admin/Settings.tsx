import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Save, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    siteName: 'Portal de Formações',
    siteDescription: 'Plataforma de gestão de formações',
    emailNotifications: true,
    autoApproveTrainers: false,
    requireEmailVerification: true,
    maxStudentsPerCourse: 50,
    allowSelfRegistration: true,
  });

  const handleSave = () => {
    // TODO: Implement save to backend
    alert(t('messages.settingsSaved'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {t('navigation.settings')}
              </h1>
              <p className="text-gray-400">{t('admin.systemConfiguration')}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold text-white">{t('admin.generalSettings')}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('admin.siteName')}
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('admin.siteDescription')}
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold text-white">{t('admin.notifications')}</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                    {t('admin.emailNotifications')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {t('admin.emailNotificationsDesc')}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-red-700"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold text-white">{t('admin.security')}</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                    {t('admin.autoApproveTrainers')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {t('admin.autoApproveTrainersDesc')}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.autoApproveTrainers}
                    onChange={(e) => setSettings({ ...settings, autoApproveTrainers: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-red-700"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                    {t('admin.requireEmailVerification')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {t('admin.requireEmailVerificationDesc')}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-red-700"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-white font-medium group-hover:text-red-400 transition-colors">
                    {t('admin.allowSelfRegistration')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {t('admin.allowSelfRegistrationDesc')}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.allowSelfRegistration}
                    onChange={(e) => setSettings({ ...settings, allowSelfRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-red-700"></div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('admin.maxStudentsPerCourse')}
                </label>
                <input
                  type="number"
                  value={settings.maxStudentsPerCourse}
                  onChange={(e) => setSettings({ ...settings, maxStudentsPerCourse: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-900/50"
          >
            <Save className="w-5 h-5" />
            {t('admin.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}

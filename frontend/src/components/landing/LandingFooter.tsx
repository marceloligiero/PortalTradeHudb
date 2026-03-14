import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#0A0A0A] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-sds.png" alt="TradeHub" className="h-8 brightness-0 invert" />
              <span className="font-display text-lg font-bold text-white">TradeHub</span>
            </div>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-body text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              {t('landing.footer.platform')}
            </h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.courses')}</Link></li>
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.tutoring')}</Link></li>
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.reports')}</Link></li>
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.tickets')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-body text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              {t('landing.footer.resources')}
            </h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.docs')}</Link></li>
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.apiDocs')}</Link></li>
              <li><Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors font-body">{t('landing.footer.support')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-body text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              {t('landing.footer.legal')}
            </h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-gray-500 cursor-default font-body">{t('landing.footer.terms')}</span></li>
              <li><span className="text-sm text-gray-500 cursor-default font-body">{t('landing.footer.privacy')}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-xs text-gray-600 text-center font-body">
            © 2026 TradeHub. {t('landing.footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

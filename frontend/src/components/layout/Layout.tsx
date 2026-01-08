import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 print:bg-white ${
      isDark 
        ? 'bg-[#0a0a0a] text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-blob ${
          isDark ? 'bg-red-600/5' : 'bg-red-600/10'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-blob animation-delay-2000 ${
          isDark ? 'bg-blue-600/5' : 'bg-blue-600/10'
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <div className="flex print:block">
          <Sidebar />
          <main className="flex-1 p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

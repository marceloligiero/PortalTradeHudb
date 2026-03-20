import PortalLayout from './PortalLayout';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <PortalLayout
      title="Portal Formações"
      sidebarContent={<Sidebar />}
      showPendingBanner
    />
  );
}

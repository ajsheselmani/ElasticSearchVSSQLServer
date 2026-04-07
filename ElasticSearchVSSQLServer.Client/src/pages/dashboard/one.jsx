import { useAuthContext } from "src/auth/hooks";
import { OverviewAnalyticsView } from "src/sections/overview/analytics/view";
import FinanceDashboardView from "src/pages/dashboard/finance/views/finance-dashboard-view";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `Ballina - ${CONFIG.appName}` };

export default function Page() {
  const { user } = useAuthContext();
  const userRole = user?.roles?.[0]?.name ?? "";
  const renderDashboardByRole = () => {
    switch (userRole) {
      case "Finances":
        return <FinanceDashboardView />;
      default:
        return <OverviewAnalyticsView />;
    }
  };
  return (
    <>
      <title>{metadata.title}</title>

      {renderDashboardByRole()}
    </>
  );
}

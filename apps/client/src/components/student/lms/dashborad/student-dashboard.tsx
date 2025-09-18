import DashboardTabs from "./dashboard-tabs";

export default function StudentDashboard() {
  return (
    <div
    className="flex flex-col gap-6 w-full  mx-auto px-2 md:px-8 py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      <DashboardTabs />
    </div>
  );
}

/**
import OverviewCards from "./dashborad/overview-cards";
import ProgressSection from "./dashborad/progress-section";
import ActivityFeed from "./dashborad/activity-feed";
import QuickLinks from "./dashborad/quick-links";
import Achievements from "./dashborad/achievements";

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 md:px-8 py-8">
      <OverviewCards />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <ProgressSection />
          <ActivityFeed />
        </div>
        <div className="flex flex-col gap-6">
          <QuickLinks />
          <Achievements />
        </div>
      </div>
    </div>
  );
}
*/
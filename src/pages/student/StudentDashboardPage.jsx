import React, { useEffect } from "react";
import useDashboardStore from "../../store/student/dashboardStore";
import RecommendedPages from "../../features/student/dashboard/components/RecommendedPage";
import ModuleList from "../../features/student/dashboard/components/ModuleList";
import ScoreOverview from "../../features/student/dashboard/components/ScoreOverview";
import StatisticsOverview from "../../features/student/dashboard/components/StatisticsOverview";

const DashboardPage = () => {
  const { fetchDashboardData, isLoading, error } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Dependency array is simplified

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Your Dashboard
      </h1>

      {/* Enhanced Statistics Overview */}
      <div className="mb-8">
        <StatisticsOverview />
      </div>

      <RecommendedPages />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
        <div className="lg:col-span-2">
          <ModuleList />
        </div>

        <div>
          <ScoreOverview />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

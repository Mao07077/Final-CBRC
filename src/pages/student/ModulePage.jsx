import React, { useEffect } from "react";
import useDashboardStore from "../../store/student/dashboardStore";
import ModuleCard from "../../features/student/dashboard/components/ModuleCard";

const ModulePage = () => {
  // Debug: log all module IDs and all score module_ids for easier troubleshooting
  const allModuleIds = modules.map((m) => m._id);
  window.allModuleIdsDebug = allModuleIds;
  console.log('All module IDs:', allModuleIds);
  // If preTests is available, extract all score module_ids
  const allScoreModuleIds = preTests.map((t) => t.module_id);
  window.allScoreModuleIdsDebug = allScoreModuleIds;
  console.log('All score module_ids (from preTests):', allScoreModuleIds);
  const { modules, preTests, postTests, isLoading, error, fetchDashboardData } =
    useDashboardStore();

  useEffect(() => {
    // Fetch data only if it hasn't been loaded already
    if (modules.length === 0) {
      fetchDashboardData();
    }
  }, [modules.length, fetchDashboardData]);

  // Show loading indicator only if modules aren't loaded yet
  if (isLoading && modules.length === 0) {
    return <div className="text-center p-4">Loading modules...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  // Debug: log preTests and postTests for troubleshooting
  console.log('preTests (from backend):', preTests);
  window.preTestsDebug = preTests;
  console.log('postTests:', postTests);
  window.postTestsDebug = postTests;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Modules</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          // Consider test completed if total_questions > 0 (even if score is 0)
          const isPreTestCompleted = preTests.some(
            (test) => test.module_id === module._id && typeof test.total_questions === 'number' && test.total_questions > 0
          );
          const isPostTestCompleted = postTests.some(
            (test) => test.module_id === module._id && typeof test.total_questions === 'number' && test.total_questions > 0
          );

          return (
            <ModuleCard
              key={module._id}
              module={module}
              isPreTestCompleted={isPreTestCompleted}
              isPostTestCompleted={isPostTestCompleted}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ModulePage;

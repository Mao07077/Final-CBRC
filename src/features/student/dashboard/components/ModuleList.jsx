import React from "react";
import useDashboardStore from "../../../../store/student/dashboardStore";
import ModuleCard from "./ModuleCard";

const ModuleList = () => {
  const { modules, preTests, postTests } = useDashboardStore();

  // Helper function to check if pre-test is completed for a module
  const isPreTestCompleted = (moduleId) => {
    return preTests.some(test => test.module_id === moduleId);
  };

  // Helper function to check if post-test is completed for a module
  const isPostTestCompleted = (moduleId) => {
    return postTests.some(test => test.module_id === moduleId);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-dark mb-4">
        Your Modules
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard
            key={module._id}
            module={module}
            isPreTestCompleted={isPreTestCompleted(module._id)}
            isPostTestCompleted={isPostTestCompleted(module._id)}
          />
        ))}
      </div>
      {modules.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No modules available at the moment.
        </p>
      )}
    </div>
  );
};

export default ModuleList;

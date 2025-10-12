import React, { useEffect } from "react";
import useDashboardStore from "../../store/student/dashboardStore";


const ModulePage = () => {
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

  return (
    <div>
      <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Hello World</button>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Modules</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          // Find pre-test and post-test objects for this module
          const preTest = preTests.find((test) => test.module_id === module._id);
          const postTest = postTests.find((test) => test.module_id === module._id);

          // A test is completed if total_questions > 0 (as per backend logic)
          const isPreTestCompleted = preTest && typeof preTest.total_questions === 'number' && preTest.total_questions > 0;
          const isPostTestCompleted = postTest && typeof postTest.total_questions === 'number' && postTest.total_questions > 0;

          let statusText, buttonText, isButtonDisabled, buttonAction;
          if (isPostTestCompleted) {
            statusText = "Completed";
            buttonText = "Completed";
            isButtonDisabled = true;
            buttonAction = undefined;
          } else if (isPreTestCompleted) {
            statusText = "In Progress";
            buttonText = "Continue Module";
            buttonAction = () => window.location.href = `/student/module/${module._id}`;
            isButtonDisabled = false;
          } else {
            statusText = "Not Started";
            buttonText = "Take Pre-Test";
            buttonAction = () => window.location.href = `/student/pre-test/${module._id}`;
            isButtonDisabled = false;
          }

          const imageUrl = module.image_url || "https://via.placeholder.com/400x200?text=Module";

          return (
            <div
              key={module._id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 ${isPostTestCompleted ? "opacity-60" : ""}`}
            >
              <div className="w-full aspect-[2/1] bg-gray-100 overflow-hidden rounded-t-2xl">
                <img
                  src={imageUrl}
                  alt={module.title}
                  className="w-full h-full object-contain object-center block bg-white"
                  style={{ aspectRatio: '2/1', display: 'block', maxHeight: '200px' }}
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-primary-dark mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Status: <span className="font-semibold">{statusText}</span>
                </p>
                <div className="mt-auto">
                  <button
                    onClick={buttonAction}
                    disabled={isButtonDisabled}
                    className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModulePage;

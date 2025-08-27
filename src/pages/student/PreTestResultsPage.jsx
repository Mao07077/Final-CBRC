import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const PreTestResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;
  const moduleTitle = location.state?.moduleTitle || "Module";
  const moduleId = location.state?.moduleId;

  // If no results data, redirect to dashboard
  if (!results) {
    navigate("/student/dashboard");
    return null;
  }

  const { correct, incorrect, total_questions, time_spent } = results;
  const percentage = Math.round((correct / total_questions) * 100);
  
  // Format time spent
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Data for pie chart
  const pieData = [
    { name: "Correct", value: correct, color: "#10B981" },
    { name: "Incorrect", value: incorrect, color: "#EF4444" },
  ];

  // Custom label for pie chart
  const renderLabel = (entry) => {
    return `${entry.value}`;
  };

  const handleContinueToModule = () => {
    navigate(`/module/${moduleId}`);
  };

  const handleBackToDashboard = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              Pre-Test Results
            </h1>
            <h2 className="text-xl text-gray-600">{moduleTitle}</h2>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Score Chart */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Your Score
              </h3>
              <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <div className="text-3xl font-bold text-primary-dark">
                  {percentage}%
                </div>
                <div className="text-gray-600">
                  {correct} out of {total_questions} correct
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Test Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-semibold text-gray-800">
                      {total_questions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Correct Answers:</span>
                    <span className="font-semibold text-green-600">
                      {correct}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Incorrect Answers:</span>
                    <span className="font-semibold text-red-600">
                      {incorrect}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Time Spent:</span>
                    <span className="font-semibold text-blue-600">
                      {formatTime(time_spent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-bold text-primary-dark text-lg">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Message */}
              <div className={`rounded-lg p-4 ${
                percentage >= 80 
                  ? "bg-green-50 border border-green-200" 
                  : percentage >= 60 
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-red-50 border border-red-200"
              }`}>
                <div className={`font-semibold ${
                  percentage >= 80 
                    ? "text-green-800" 
                    : percentage >= 60 
                    ? "text-yellow-800"
                    : "text-red-800"
                }`}>
                  {percentage >= 80 
                    ? "Excellent work!" 
                    : percentage >= 60 
                    ? "Good effort!"
                    : "Keep practicing!"}
                </div>
                <div className={`text-sm mt-1 ${
                  percentage >= 80 
                    ? "text-green-700" 
                    : percentage >= 60 
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}>
                  {percentage >= 80 
                    ? "You're ready to continue with the module." 
                    : percentage >= 60 
                    ? "You have a good understanding. Continue to improve with the module."
                    : "Consider reviewing the material before continuing."}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleContinueToModule}
              className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
            >
              Continue to Module
            </button>
            <button
              onClick={handleBackToDashboard}
              className="px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreTestResultsPage;

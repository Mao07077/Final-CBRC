import React from "react";
import { FiFileText, FiDownload, FiPrinter } from "react-icons/fi";

const StudentDataPrintingPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
          <p className="text-gray-600">
            View and download your academic reports and data
          </p>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Reports</h2>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiDownload className="mr-2" />
                Download All
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <FiPrinter className="mr-2" />
                Print
              </button>
            </div>
          </div>

          {/* Report Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FiFileText className="text-blue-600 mr-3" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Academic Performance Report</h3>
                  <p className="text-sm text-gray-600">Overall performance across all modules</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Download
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FiFileText className="text-green-600 mr-3" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Test Results Summary</h3>
                  <p className="text-sm text-gray-600">Pre-test and post-test results</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Download
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FiFileText className="text-purple-600 mr-3" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Study Activity Report</h3>
                  <p className="text-sm text-gray-600">Notes, flashcards, and study sessions</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Download
              </button>
            </div>
          </div>

          {/* No Reports Message */}
          <div className="text-center py-8 text-gray-500">
            <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No reports available yet</p>
            <p className="text-sm">Complete some modules to generate your reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDataPrintingPage;

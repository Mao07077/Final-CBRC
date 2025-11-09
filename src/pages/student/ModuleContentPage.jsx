import React, { useState, useEffect } from "react";
import ModuleFlashcards from "../../features/student/dashboard/components/ModuleFlashcards";
import { useParams, useNavigate } from "react-router-dom";
import moduleService from "../../services/moduleService";

const ModuleContentPage = () => {
  const { moduleId } = useParams();
  console.log('ModuleContentPage moduleId from useParams:', moduleId);
  const [showFileModal, setShowFileModal] = useState(false);
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [status, setStatus] = useState({ pre_test_completed: false, post_test_completed: false, module_completed: false, all_modules_completed: false });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showAllCompleteModal, setShowAllCompleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModuleContent();
    fetchStatus();
  }, [moduleId]);

  const fetchStatus = async () => {
    try {
      if (!moduleId) return;
      setLoadingStatus(true);
      const userId = localStorage.getItem('id_number') || JSON.parse(localStorage.getItem('userData')||'{}').id_number;
      if (!userId) return;
      const data = await moduleService.getModuleStatus(moduleId, userId);
      setStatus(data);
    } catch (e) {
      console.warn('Failed to fetch module status', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchModuleContent = async () => {
    try {
      setIsLoading(true);
      const data = await moduleService.getModule(moduleId);
      setModule(data);
    } catch (error) {
      console.error("Failed to fetch module:", error);
      setError("Failed to load module content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePostTest = () => {
    if (status?.module_completed) return; // safety
    navigate(`/post-test/${moduleId}`);
  };

  const handleCheckAllCompleted = async () => {
    try {
      const userId = localStorage.getItem('id_number') || JSON.parse(localStorage.getItem('userData')||'{}').id_number;
      if (!userId) return;
      const full = await moduleService.getAllModulesCompletedStatus(userId);
      if (full.allModulesCompleted) {
        setShowAllCompleteModal(true);
      }
    } catch (e) {
      console.warn('Failed to check all modules completion', e);
    }
  };

  const handleResetAll = async () => {
    try {
      const userId = localStorage.getItem('id_number') || JSON.parse(localStorage.getItem('userData')||'{}').id_number;
      if (!userId) return;
      await moduleService.resetAllModules(userId);
      setShowAllCompleteModal(false);
      await fetchStatus();
      await fetchModuleContent();
    } catch (e) {
      alert('Reset failed: '+ (e?.response?.data?.detail || e.message));
    }
  };

  const handleBackToDashboard = () => {
    navigate("/student/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button
          onClick={handleBackToDashboard}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-600 text-xl mb-4">Module not found.</div>
        <button
          onClick={handleBackToDashboard}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Use Cloudinary URLs directly
  const imageUrl = module.image_url || null;
  const documentUrl = module.document_url || null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Image */}
          {imageUrl && (
            <div className="h-64 bg-gray-200">
              <img
                src={imageUrl}
                alt={module.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Content */}
          <div className="p-8">
            {/* Title and Navigation */}
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-primary-dark">
                {module.title}
              </h1>
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Module Information */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Program</h3>
                  <p className="text-gray-600">{module.program || "General"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                  <p className="font-medium">
                    {status.module_completed ? (
                      <span className="text-green-600">Completed</span>
                    ) : status.pre_test_completed ? (
                      <span className="text-blue-600">Pre-Test Done</span>
                    ) : (
                      <span className="text-gray-600">Not Started</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Module Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                About This Module
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {module.description || 
                    `Welcome to the ${module.title} module. This module will provide you with comprehensive knowledge and skills in this subject area. Complete the lessons and activities to master the concepts.`
                  }
                </p>
              </div>
                {/* Auto-generated Flashcards */}
                <ModuleFlashcards moduleId={moduleId} />
            </div>

            {/* Learning Objectives */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Learning Objectives
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Understand the fundamental concepts of {module.title}</li>
                <li>Apply theoretical knowledge to practical scenarios</li>
                <li>Develop problem-solving skills in this subject area</li>
                <li>Prepare for assessment and evaluation</li>
              </ul>
            </div>

            {/* Module Content Placeholder */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Module Content
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-semibold">📚</span>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800">
                    Interactive Learning Content
                  </h3>
                </div>
                <p className="text-blue-700">
                  Module content including lessons, videos, and interactive materials will be available here. 
                  Continue studying the materials and complete all activities before taking the post-test.
                </p>
                {/* Module File Button */}
                {documentUrl && (
                  <button
                    onClick={() => setShowFileModal(true)}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700"
                  >
                    View Module File
                  </button>
                )}
              </div>
              {/* File Modal */}
              {showFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
                    <button
                      onClick={() => setShowFileModal(false)}
                      className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h2 className="text-xl font-bold mb-4">Module File</h2>
                    <div className="w-full h-[70vh]">
                      <iframe
                        src={documentUrl}
                        title="Module File"
                        className="w-full h-full border rounded"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress and Actions */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 space-y-1">
                  {status.pre_test_completed ? (
                    <>
                      <p>Pre-test completed.</p>
                      {!status.post_test_completed && <p>Study the content then take the post-test.</p>}
                      {status.post_test_completed && <p>Post-test completed.</p>}
                    </>
                  ) : (
                    <p>Take the pre-test to begin this module.</p>
                  )}
                  {status.module_completed && <p className="text-green-700 font-semibold">Module fully completed.</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleTakePostTest}
                    disabled={!status.pre_test_completed || status.post_test_completed}
                    className={`px-6 py-2 rounded-lg font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${(!status.pre_test_completed || status.post_test_completed) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'}`}
                  >
                    {status.post_test_completed ? 'Post-Test Done' : 'Take Post-Test'}
                  </button>
                  {status.module_completed && (
                    <button
                      onClick={handleCheckAllCompleted}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Check All Modules
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAllCompleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Congratulations! 🎉</h2>
          <p className="text-gray-700">You've completed all modules. Press OK to reset and retake everything, or Cancel to keep your results.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAllCompleteModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
            <button onClick={handleResetAll} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark">OK Retake All</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default ModuleContentPage;

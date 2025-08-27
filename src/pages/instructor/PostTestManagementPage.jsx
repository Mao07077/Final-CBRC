import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import usePostTestStore from "../../store/instructor/postTestStore";
import TestList from "../../features/instructor/instructorPostTests/components/TestList";
import Modal from "../../components/common/Modal";
import TestBuilderForm from "../../features/instructor/instructorPostTests/components/TestBuilderForm";

const PostTestManagementPage = () => {
  const [selectedModule, setSelectedModule] = useState("");
  const {
    modules,
    tests,
    isLoading,
    error,
    isModalOpen,
    closeModal,
    newTest, // Use the new newTest function
  } = usePostTestStore();

  const handleCreateTest = () => {
    if (selectedModule) {
      newTest(selectedModule);
    }
  };

  const moduleTests = tests[selectedModule] || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Post-Test Management
        </h1>
        <button
          onClick={handleCreateTest}
          disabled={!selectedModule}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FiPlus className="mr-2 h-5 w-5" />
          <span>Create New Test</span>
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="module-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select a Module to View Tests
        </label>
        <select
          id="module-select"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>-- Select a Module --</option>
          {modules.map((module) => (
            <option key={module._id} value={module._id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <div className="text-center p-4">Loading tests...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}
      {!isLoading && !error && (
        <TestList tests={moduleTests} moduleId={selectedModule} />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={usePostTestStore.getState().editingTest?._id.startsWith('new_') ? 'Create New Test' : 'Edit Test'}>
        <TestBuilderForm moduleId={selectedModule} />
      </Modal>
    </div>
  );
};

export default PostTestManagementPage;

import { useState, useEffect } from "react";
import useModuleStore from "../../../store/instructor/moduleStore";
import PreTestManager from "./components/PreTestManager";
import usePostTestStore from "../../../store/instructor/postTestStore";
import Modal from "../../../components/common/Modal";
import TestBuilderForm from "./components/TestBuilderForm";
import useAuthStore from "../../../store/authStore";

const PreTestManagementPage = () => {
  const { modules, fetchModules, isLoading: modulesLoading } = useModuleStore();
  const { userData } = useAuthStore();
  const { newTest, isModalOpen, closeModal } = usePostTestStore();
  const [selectedModuleId, setSelectedModuleId] = useState("");

  useEffect(() => {
    if (userData?.id_number) {
      fetchModules(userData.id_number, userData.program);
    } else {
      fetchModules();
    }
  }, [fetchModules, userData]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pre-Test Management</h1>
  <label className="block mb-2 font-semibold">Select a Module to View Pre-Test:</label>
      {modulesLoading ? (
        <p>Loading modules...</p>
      ) : (
        <>
          <select
            value={selectedModuleId}
            onChange={e => setSelectedModuleId(e.target.value)}
            className="form-select mb-6 max-w-full"
          >
            <option value="">-- Select Module --</option>
            {modules.map(module => (
              <option key={module._id} value={module._id}>
                {module.title} {module.program ? `(${module.program})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => newTest(selectedModuleId)}
            disabled={!selectedModuleId}
            className="mb-6 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create New Test
          </button>
        </>
      )}
      {selectedModuleId && <PreTestManager moduleId={selectedModuleId} />}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={usePostTestStore.getState().editingTest?._id?.toString?.().startsWith('new_') ? 'Create New Test' : 'Edit Test'}
      >
        <TestBuilderForm moduleId={selectedModuleId} />
      </Modal>
    </div>
  );
};

export default PreTestManagementPage;

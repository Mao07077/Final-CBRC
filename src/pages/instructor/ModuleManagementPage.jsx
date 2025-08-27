import { useEffect } from "react";
import useModuleStore from "../../store/instructor/moduleStore";
import ModuleTable from "../../features/instructor/instructorModules/components/ModuleTable";
import ModuleForm from "../../features/instructor/instructorModules/components/ModuleForm";
import Modal from "../../components/common/Modal";
import { FiPlus } from "react-icons/fi";

const ModuleManagementPage = () => {
  const {
    modules,
    fetchModules,
    isLoading,
    error,
    isModalOpen,
    openModal,
    closeModal,
    editingModule,
  } = useModuleStore();

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Module Management
        </h1>
        <button
          onClick={() => openModal(null)}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
        >
          <FiPlus className="mr-2" /> Create New Module
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}
      
      {isLoading && !modules.length ? (
        <div className="text-center p-4">Loading modules...</div>
      ) : (
        !error && <ModuleTable modules={modules} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingModule ? "Edit Module" : "Create New Module"}
      >
        <ModuleForm />
      </Modal>
    </div>
  );
};

export default ModuleManagementPage;

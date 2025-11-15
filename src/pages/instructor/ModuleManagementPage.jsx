import { useEffect } from "react";
import useModuleStore from "../../store/instructor/moduleStore";
import ModuleTable from "../../features/instructor/instructorModules/components/ModuleTable";
import ModuleForm from "../../features/instructor/instructorModules/components/ModuleForm";
import Modal from "../../components/common/Modal";
// Removed create button per updated role policy (admin only creates modules)

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
        {/* Creation button removed; instructors cannot create new modules */}
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

      {/* Modal still available only for editing existing modules; prevent opening with null */}
      {editingModule && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={"Edit Module"}
        >
          <ModuleForm />
        </Modal>
      )}
    </div>
  );
};

export default ModuleManagementPage;

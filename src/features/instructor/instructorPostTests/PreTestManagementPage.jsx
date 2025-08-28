import { useState, useEffect } from "react";
import useModuleStore from "../../../store/instructor/moduleStore";
import PreTestManager from "./components/PreTestManager";

const PreTestManagementPage = () => {
  const { modules, fetchModules, isLoading: modulesLoading } = useModuleStore();
  const [selectedModuleId, setSelectedModuleId] = useState("");

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pre-Test Management</h1>
      <label className="block mb-2 font-semibold">Select a Module to View Pre-Test:</label>
      {modulesLoading ? (
        <p>Loading modules...</p>
      ) : (
        <select
          value={selectedModuleId}
          onChange={e => setSelectedModuleId(e.target.value)}
          className="form-select mb-6"
        >
          <option value="">-- Select Module --</option>
          {modules.map(module => (
            <option key={module._id} value={module._id}>
              {module.title}
            </option>
          ))}
        </select>
      )}
      {selectedModuleId && <PreTestManager moduleId={selectedModuleId} />}
    </div>
  );
};

export default PreTestManagementPage;

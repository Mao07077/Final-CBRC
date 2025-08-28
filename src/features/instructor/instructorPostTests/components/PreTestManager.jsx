import { useEffect } from "react";
import usePreTestStore from "../../../../store/instructor/preTestStore";
import TestList from "./TestList";

const PreTestManager = ({ moduleId }) => {
  const { fetchPreTest, preTests, isLoading, error } = usePreTestStore();

  useEffect(() => {
    if (moduleId) {
      fetchPreTest(moduleId);
    }
  }, [moduleId]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pre-Test Management</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <TestList tests={preTests[moduleId]?.questions || []} moduleId={moduleId} />
    </div>
  );
};

export default PreTestManager;

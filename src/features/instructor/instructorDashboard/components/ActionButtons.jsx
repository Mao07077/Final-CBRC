import { FiPlusCircle } from "react-icons/fi";

const ActionButtons = () => {
  // Add navigation or modal logic here
  return (
    <div className="card flex items-center justify-around">
      <button className="dashboard-action-button">
        <FiPlusCircle className="w-10 h-10 mb-2" />
        <span className="font-semibold">Create Module</span>
      </button>
      <button className="dashboard-action-button">
        <FiPlusCircle className="w-10 h-10 mb-2" />
        <span className="font-semibold">Create Post-Test</span>
      </button>
    </div>
  );
};

export default ActionButtons;

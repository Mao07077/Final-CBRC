import React from "react";
import { useNavigate } from "react-router-dom";

// Fallback image if a module doesn't have one
const FALLBACK_IMAGE_URL = "https://via.placeholder.com/400x200?text=Module";

const ModuleCard = ({ module, isPreTestCompleted, isPostTestCompleted }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  let statusText, buttonText, isButtonDisabled, buttonAction;

  if (isPostTestCompleted) {
    statusText = "Completed";
    buttonText = "Completed";
    isButtonDisabled = true;
  } else if (isPreTestCompleted) {
    statusText = "In Progress";
    buttonText = "Continue Module";
    buttonAction = () => navigate(`/module/${module._id}`);
  } else {
    statusText = "Not Started";
    buttonText = "Take Pre-Test";
    buttonAction = () => navigate(`/pre-test/${module._id}`);
  }

  const imageUrl = module.image_url
    ? module.image_url
    : FALLBACK_IMAGE_URL;

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 ${
        isPostTestCompleted ? "opacity-60" : ""
      }`}
    >
      <img
        src={imageUrl}
        alt={module.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-primary-dark mb-2">
          {module.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Status: <span className="font-semibold">{statusText}</span>
        </p>
        <div className="mt-auto">
          <button
            onClick={buttonAction}
            disabled={isButtonDisabled}
            className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;

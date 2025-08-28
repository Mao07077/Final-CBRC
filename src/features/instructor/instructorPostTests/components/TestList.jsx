import { FiEdit, FiTrash2 } from "react-icons/fi";
import usePreTestStore from "../../../../store/instructor/preTestStore";

const TestList = ({ tests, moduleId }) => {
  const { fetchPreTest, preTests, isLoading, error, success, updatePreTest } = usePreTestStore();
  // For editing, you can add modal logic as needed

  if (!preTests[moduleId] || !preTests[moduleId].questions || !preTests[moduleId].questions.length) return <p>No pre-tests found for this module.</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        <li key={preTests[moduleId].pre_test_id} className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <span className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
              {preTests[moduleId].title}
            </span>
            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                onClick={() => {/* open edit modal logic here */}}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors duration-200"
                aria-label={`Edit ${preTests[moduleId].title}`}
              >
                <FiEdit className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {preTests[moduleId].questions.length} questions
          </div>
          {/* You can add more details or actions here */}
        </li>
      </ul>
    </div>
  );
};

export default TestList;

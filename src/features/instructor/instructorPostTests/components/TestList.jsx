import { FiEdit, FiTrash2 } from "react-icons/fi";
import usePostTestStore from "../../../../store/instructor/postTestStore";

const TestList = ({ tests, moduleId }) => {
  const { openModal, deleteTest } = usePostTestStore();

  if (!tests.length) return <p>No post-tests found for this module.</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tests.map((test) => (
          <li key={test._id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <span className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
                {test.title}
              </span>
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => openModal(test)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors duration-200"
                  aria-label={`Edit ${test.title}`}
                >
                  <FiEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteTest(test._id, moduleId)}
                  className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                  aria-label={`Delete ${test.title}`}
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestList;

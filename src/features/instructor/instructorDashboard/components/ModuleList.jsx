import { FiBookOpen } from "react-icons/fi";

const ModuleList = ({ modules, isLoading }) => {
  return (
    <div className="card">
      <h3 className="text-xl font-bold text-primary-dark mb-4">My Modules</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {modules.map((module) => (
            <li
              key={module._id}
              className="list-item"
            >
              <FiBookOpen className="mr-3 text-primary" />
              <span>{module.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModuleList;

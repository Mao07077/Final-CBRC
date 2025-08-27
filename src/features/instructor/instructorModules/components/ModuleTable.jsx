import { FiEdit, FiTrash2 } from "react-icons/fi";
import useModuleStore from "../../../../store/instructor/moduleStore";

const ModuleTable = ({ modules }) => {
  const { openModal, deleteModule } = useModuleStore();

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Module Title</th>
            <th>Program</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module._id}>
              <td>
                {module.title}
                <br />
                {/* Show module image if available */}
                {module.image_url && (
                  <img
                    src={module.image_url}
                    alt={module.title}
                    style={{
                      maxWidth: "120px",
                      marginTop: "8px",
                    }}
                  />
                )}
                {/* Show document link if available */}
                {module.document_url && (
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={module.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Download Document
                    </a>
                  </div>
                )}
              </td>
              <td>{module.program}</td>
              <td>
                <button
                  onClick={() => openModal(module)}
                  className="btn-ghost"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => deleteModule(module._id)}
                  className="btn-ghost-danger"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModuleTable;

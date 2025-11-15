import { FiEdit } from "react-icons/fi";
import useModuleStore from "../../../../store/instructor/moduleStore";
import React, { useState, useEffect } from "react";

// Helper: parse publish_at robustly. If string lacks timezone info, assume UTC.
const parsePublishAt = (val) => {
  if (!val) return null;
  try {
    if (typeof val === 'string') {
      // If string already contains timezone indicator (Z or +/-), use as-is
      if (!/[Zz]|[+-]\d{2}:?\d{2}/.test(val)) {
        // Append Z to treat as UTC
        return new Date(val + 'Z');
      }
    }
    return new Date(val);
  } catch (e) {
    return new Date(val);
  }
};

const ModuleTable = ({ modules }) => {
  const { openModal, scheduleModule, publishNow, fetchModules } = useModuleStore();
  const [scheduleValues, setScheduleValues] = useState({}); // moduleId -> local datetime string

  // Auto refresh to flip scheduled -> posted when time passes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchModules();
    }, 60000); // every 60s
    return () => clearInterval(interval);
  }, [fetchModules]);

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Module Title</th>
            <th>Program</th>
            <th>Status</th>
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
                {module.is_published ? (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Posted</span>
                ) : module.publish_at ? (
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Scheduled on</span>
                    <span className="text-xs text-gray-600">{parsePublishAt(module.publish_at).toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Draft</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => openModal(module)}
                  className="btn-ghost"
                >
                  <FiEdit />
                </button>
                {/* Controls only if not scheduled or posted */}
                {!module.is_published && !module.publish_at && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="datetime-local"
                      className="border rounded px-2 py-1 text-sm"
                      value={scheduleValues[module._id] || ''}
                      onChange={(e) => setScheduleValues({ ...scheduleValues, [module._id]: e.target.value })}
                    />
                    <button
                      className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => {
                        const v = scheduleValues[module._id];
                        if (!v) return;
                        // Parse the datetime-local value explicitly to avoid timezone parsing issues
                        const toISO = (local) => {
                          const [datePart, timePart] = (local || '').split('T');
                          if (!datePart || !timePart) return new Date(local).toISOString();
                          const [y, m, d] = datePart.split('-').map(Number);
                          const [hh, mm] = timePart.split(':').map(Number);
                          const dt = new Date(y, m - 1, d, hh || 0, mm || 0, 0);
                          return dt.toISOString();
                        };
                        const iso = toISO(v);
                        scheduleModule(module._id, iso);
                      }}
                    >
                      Schedule
                    </button>
                    <button
                      className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                      onClick={() => publishNow(module._id)}
                    >
                      Post now
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModuleTable;

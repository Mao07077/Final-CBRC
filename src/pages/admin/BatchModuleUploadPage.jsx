import React, { useEffect, useRef } from "react";
import useBatchModuleStore from "../../store/admin/batchModuleStore";
import useAuthStore from "../../store/authStore";

const ProgramSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    required
  >
    <option value="">Select program</option>
    <option value="LET">LET</option>
    <option value="CSE">CSE</option>
    <option value="NLE">NLE</option>
  </select>
);

const InstructorMulti = ({ options, value, onChange }) => (
  <select
    multiple
    value={value}
    onChange={(e) => {
      const arr = Array.from(e.target.selectedOptions).map((o) => o.value);
      onChange(arr);
    }}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-24"
  >
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.name} ({opt.id})
      </option>
    ))}
  </select>
);

const BatchModuleUploadPage = () => {
  const fileRef = useRef(null);
  const {
    instructors,
    rows,
    isLoading,
    error,
    success,
    fetchInstructors,
    setFiles,
    updateRow,
    removeRow,
    submitBatch,
  } = useBatchModuleStore();
  const { userData } = useAuthStore();

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handlePickFiles = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFiles(files);
  };

  const canSubmit = rows.length > 0 && rows.every((r) => r.program && r.title && r.file && r.cover);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Batch Module Upload</h1>
        <div>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={() => fileRef.current?.click()}
          >
            Select Documents
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
            onChange={handlePickFiles}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4" role="alert">
          {success}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-gray-600">Pick multiple module documents to start. You can set per-row metadata, cover image, assignments, and schedule.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Title / Topic</th>
                <th>Description</th>
                <th>Program</th>
                <th>Assign Instructors</th>
                {/* Publish column removed: instructor handles scheduling/publish */}
                <th>Cover Image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="align-top">
                    <div className="text-sm font-medium text-gray-800">{r.file?.name}</div>
                    <div className="text-xs text-gray-500">{Math.round((r.file?.size || 0)/1024)} KB</div>
                  </td>
                  <td className="align-top w-64">
                    <label className="block text-xs text-gray-600">Title</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={r.title}
                      onChange={(e) => updateRow(idx, { title: e.target.value })}
                      required
                    />
                    <label className="block text-xs text-gray-600 mt-2">Topic</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={r.topic}
                      onChange={(e) => updateRow(idx, { topic: e.target.value })}
                      required
                    />
                  </td>
                  <td className="align-top w-72">
                    <textarea
                      rows={4}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Optional description"
                      value={r.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                    />
                  </td>
                  <td className="align-top w-36">
                    <ProgramSelect value={r.program} onChange={(v) => updateRow(idx, { program: v })} />
                  </td>
                  <td className="align-top w-64">
                    <InstructorMulti
                      options={instructors}
                      value={r.assigned}
                      onChange={(arr) => updateRow(idx, { assigned: arr })}
                    />
                  </td>
                  {/* Scheduling controls removed; instructor will schedule/publish */}
                  <td className="align-top w-64">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => updateRow(idx, { cover: e.target.files?.[0] || null })}
                        required
                      />
                    </div>
                    {r.cover && (
                      <img
                        className="mt-2 w-32 h-20 object-cover rounded border"
                        src={URL.createObjectURL(r.cover)}
                        alt="cover preview"
                      />
                    )}
                  </td>
                  <td className="align-top">
                    <button
                      className="text-red-600 hover:text-red-800 text-sm"
                      onClick={() => removeRow(idx)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
          disabled={!canSubmit || isLoading}
          onClick={() => submitBatch(userData?.id_number)}
        >
          {isLoading ? "Uploading..." : "Submit Batch"}
        </button>
        <button
          className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          onClick={() => setFiles([])}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default BatchModuleUploadPage;

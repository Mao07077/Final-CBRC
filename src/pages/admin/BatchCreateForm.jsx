import React, { useState } from 'react';
import useAdminModulesStore from '../../store/admin/adminModulesStore';

const ProgramSelect = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
    <option value="">Select program</option>
    <option value="LET">LET</option>
    <option value="CSE">CSE</option>
    <option value="NLE">NLE</option>
  </select>
);

const BatchCreateForm = ({ instructors = [], creatorId, onClose, onSuccess, loading }) => {
  const submitBatch = useAdminModulesStore(state => state.submitBatch);
  const [program, setProgram] = useState('');
  const [rows, setRows] = useState([ { title: '', topic: '', description: '', assigned: '', documentFile: null, pictureFile: null } ]);
  const [error, setError] = useState(null);

  const addRow = () => setRows([...rows, { title: '', topic: '', description: '', assigned: '', documentFile: null, pictureFile: null }]);
  const removeRow = (idx) => setRows(rows.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) => {
    const copy = [...rows]; copy[idx] = { ...copy[idx], ...patch }; setRows(copy);
  };

  const canSubmit = program && rows.length > 0 && rows.every(r => r.title && r.topic && r.assigned && r.documentFile && r.pictureFile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) { setError('Please complete all required fields'); return; }
    try {
      await submitBatch(creatorId, program, rows.map(r => ({
        title: r.title,
        topic: r.topic,
        description: r.description,
        assigned: r.assigned,
        documentFile: r.documentFile,
        pictureFile: r.pictureFile
      })));
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || 'Batch creation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Program (applies to all rows)</label>
          <ProgramSelect value={program} onChange={setProgram} />
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={idx} className="border rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Module #{idx + 1}</div>
              <div>
                {rows.length > 1 && <button type="button" onClick={() => removeRow(idx)} className="text-red-600">Remove</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Title</label>
                <input value={r.title} onChange={(e) => updateRow(idx, { title: e.target.value })} className="mt-1 w-full rounded border px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm">Topic</label>
                <input value={r.topic} onChange={(e) => updateRow(idx, { topic: e.target.value })} className="mt-1 w-full rounded border px-2 py-1" required />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm">Description</label>
              <textarea value={r.description} onChange={(e) => updateRow(idx, { description: e.target.value })} rows={2} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-sm">Assign Instructor</label>
                <select value={r.assigned} onChange={(e) => updateRow(idx, { assigned: e.target.value })} className="mt-1 w-full rounded border px-2 py-1" required>
                  <option value="">Select instructor</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Document</label>
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => updateRow(idx, { documentFile: e.target.files?.[0] || null })} required />
              </div>
              <div>
                <label className="block text-sm">Cover Image</label>
                <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => updateRow(idx, { pictureFile: e.target.files?.[0] || null })} required />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="px-3 py-1 border rounded">Add Module</button>
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
        <button type="submit" disabled={!canSubmit || loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{loading ? 'Uploading...' : 'Submit Batch'}</button>
      </div>
    </form>
  );
};

export default BatchCreateForm;

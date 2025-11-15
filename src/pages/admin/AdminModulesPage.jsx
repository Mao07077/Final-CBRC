import React, { useEffect, useState } from 'react';
import useAdminModulesStore from '../../store/admin/adminModulesStore';
import useAuthStore from '../../store/authStore';
import BatchCreateForm from './BatchCreateForm';

const EditForm = ({ module, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    title: module?.title || '',
    topic: module?.topic || '',
    description: module?.description || '',
    program: module?.program || '',
    id_number: module?.id_number || ''
  });
  const [document, setDocument] = useState(null);
  const [picture, setPicture] = useState(null);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (document) fd.append('document', document);
    if (picture) fd.append('picture', picture);
    onSubmit(fd);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input name="title" value={form.title} onChange={handleChange} required className="mt-1 w-full rounded border px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Program</label>
          <select name="program" value={form.program} onChange={handleChange} required className="mt-1 w-full rounded border px-2 py-1">
            <option value="">Select program</option>
            <option value="LET">LET</option>
            <option value="CSE">CSE</option>
            <option value="NLE">NLE</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Topic</label>
        <input name="topic" value={form.topic} onChange={handleChange} required className="mt-1 w-full rounded border px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="mt-1 w-full rounded border px-2 py-1" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Replace Document (optional)</label>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" onChange={(e) => setDocument(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-sm font-medium">Replace Cover Image (optional)</label>
          <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setPicture(e.target.files[0])} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
};

/* Create single-module form removed — admin uses Create Module modal now */

const AdminModulesPage = () => {
  const { modules, instructors, isLoading, error, success, fetchModules, fetchInstructors, archiveModule, unarchiveModule, openEdit, closeEdit, editingModule, updateModule, createModule } = useAdminModulesStore();
  const { userData } = useAuthStore();
  const [batchOpen, setBatchOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState('');

  useEffect(() => {
    fetchModules();
    fetchInstructors();
  }, [fetchModules, fetchInstructors]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Modules</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setBatchOpen(true)}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
            >Create Module</button>
            <button
              onClick={() => setArchiveOpen(true)}
              className="px-4 py-2 border border-gray-600 text-gray-700 rounded hover:bg-gray-50"
            >Archived Modules</button>
          </div>
        </div>
      </div>
      {/* Single-create removed; admin uses Create Module modal only */}
      {batchOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-full max-h-[90vh] p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Create Modules</h2>
              <button onClick={() => setBatchOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="overflow-y-auto flex-1 mt-2">
              <div className="p-2 md:p-4">
                <BatchCreateForm instructors={instructors} creatorId={userData?.id_number} onClose={() => setBatchOpen(false)} onSuccess={() => { fetchModules(); setBatchOpen(false); }} loading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      )}
      {archiveOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-full max-h-[80vh] p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Archived Modules</h2>
              <div className="flex items-center gap-2">
                <input value={archiveQuery} onChange={(e) => setArchiveQuery(e.target.value)} placeholder="Search archived modules..." className="px-3 py-2 border rounded" />
                <button onClick={() => setArchiveOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 mt-2">
              <div className="p-2 md:p-4">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Program</th>
                      <th>Instructors</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.filter(m => m.archived).filter(m => {
                      if (!archiveQuery) return true;
                      const q = archiveQuery.toLowerCase();
                      return (m.title||'').toLowerCase().includes(q) || (m.topic||'').toLowerCase().includes(q) || ((m.assigned_instructor_ids||[]).join(', ')).toLowerCase().includes(q);
                    }).map(m => (
                      <tr key={m._id}>
                        <td className="font-semibold">{m.title}</td>
                        <td>{m.program}</td>
                        <td className="text-xs">{(m.assigned_instructor_ids||[]).join(', ') || '—'}</td>
                        <td>
                          <button
                            onClick={() => {
                              const ok = window.confirm('Restore this module from archive?');
                              if (ok) unarchiveModule(m._id);
                            }}
                            className="px-3 py-1 rounded bg-green-600 text-white"
                          >Restore</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {isLoading && !modules.length ? <div>Loading modules...</div> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Program</th>
                <th>Status</th>
                <th>Instructors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.filter(m => !m.archived).map(m => {
                const published = m.is_published;
                const scheduled = m.publish_at && !m.is_published;
                const archived = m.archived;
                return (
                  <tr key={m._id} className={archived ? 'opacity-60' : ''}>
                    <td>
                      <div className="font-semibold">{m.title}</div>
                      {m.image_url && <img src={m.image_url} alt={m.title} className="mt-2 w-32 h-20 object-cover rounded border" />}
                      {m.document_url && <div className="mt-1"><a href={m.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Open Document</a></div>}
                    </td>
                    <td>{m.program}</td>
                    <td>
                      {archived && <span className="px-2 py-1 text-xs rounded bg-gray-300 text-gray-800">Archived</span>}
                      {!archived && published && <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Posted</span>}
                      {!archived && scheduled && <div className="flex flex-col gap-1"><span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Scheduled on</span><span className="text-[10px] text-gray-600">{new Date(m.publish_at).toLocaleString()}</span></div>}
                      {!archived && !published && !scheduled && <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Draft</span>}
                    </td>
                    <td className="text-xs max-w-[160px]">
                      {(m.assigned_instructor_ids || []).join(', ') || '—'}
                    </td>
                      <td>
                      <button onClick={() => openEdit(m)} className="btn-ghost text-indigo-600">Edit</button>
                      <button onClick={() => archiveModule(m._id)} className="btn-ghost text-red-600 ml-2">Archive</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editingModule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Module</h2>
              <button onClick={closeEdit} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <EditForm module={editingModule} onSubmit={updateModule} onCancel={closeEdit} loading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModulesPage;
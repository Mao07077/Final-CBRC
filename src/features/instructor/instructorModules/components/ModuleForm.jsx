import React, { useState, useEffect } from "react";
import useModuleStore from "../../../../store/instructor/moduleStore";
import useAuthStore from '../../../../store/authStore';

const ModuleForm = () => {
  const { saveModule, editingModule, closeModal, isLoading, scheduleModule, publishNow } = useModuleStore();
  const { userData } = useAuthStore();
  const userRole = useAuthStore.getState()?.userRole || userData?.role || null;
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    program: "",
    id_number: userData?.id_number || ""
  });
  const [file, setFile] = useState(null);
  const [picture, setPicture] = useState(null);
  const [scheduleValue, setScheduleValue] = useState('');

  useEffect(() => {
    if (editingModule) {
      setFormData({
        title: editingModule.title,
        topic: editingModule.topic,
        description: editingModule.description,
        program: editingModule.program,
        id_number: userData?.id_number || ""
      });
      // Pre-fill schedule value if module has publish_at
      if (editingModule.publish_at) {
        try {
          const dt = new Date(editingModule.publish_at);
          // Local datetime-local input expects without timezone
          const isoLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0,16);
          setScheduleValue(isoLocal);
        } catch (e) {
          setScheduleValue('');
        }
      } else {
        setScheduleValue('');
      }
    } else {
      setFormData({ title: "", topic: "", description: "", program: "", id_number: userData?.id_number || "" });
    }
  }, [editingModule, userData]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = new FormData();
    Object.keys(formData).forEach((key) =>
      submissionData.append(key, formData[key])
    );
    if (file) submissionData.append("document", file);
    if (picture) submissionData.append("picture", picture);
    saveModule(submissionData);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!editingModule) return;
    if (!scheduleValue) return;
    const iso = new Date(scheduleValue).toISOString();
    await scheduleModule(editingModule._id, iso);
    closeModal();
  };

  const handlePublishNow = async (e) => {
    e.preventDefault();
    if (!editingModule) return;
    await publishNow(editingModule._id);
    closeModal();
  };

  // If the current user is an instructor editing an existing module,
  // show scheduling-only controls instead of the full edit form.
  if (userRole === 'instructor' && editingModule) {
    return (
      <div className="card max-w-md mx-auto p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Edit Schedule</h2>
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">Publish Date & Time</label>
            <input
              id="schedule"
              type="datetime-local"
              name="schedule"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : 'Schedule'}
            </button>
            <button type="button" onClick={handlePublishNow} className="px-4 py-2 bg-green-600 text-white rounded-md">
              Post now
            </button>
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {editingModule ? "Edit Module" : "Create New Module"}
      </h2>
  <form onSubmit={handleSubmit} className="space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter module title"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">e.g. Foundations of Nursing — Unit 1</p>
          </div>

          <div>
            <label htmlFor="program" className="block text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
            <select
              id="program"
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select program</option>
              <option value="LET">LET</option>
              <option value="CSE">CSE</option>
              <option value="NLE">NLE</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose the target program for this module.</p>
          </div>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topic <span className="text-red-500">*</span></label>
          <input
            id="topic"
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="Enter module topic"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a brief summary of the module content"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">Optional but recommended for clarity.</p>
        </div>
        {/* id_number is hidden but always included */}
        <input
          type="hidden"
          name="id_number"
          value={formData.id_number}
        />
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700">Attachment (required)</label>
            <div className="mt-1 flex items-center gap-2">
              <label htmlFor="document" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm cursor-pointer hover:bg-gray-50">
                Choose Document
              </label>
              <input id="document" type="file" name="document" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} required className="hidden" />
              <div className="text-sm text-gray-600">{file ? file.name : 'No file selected'}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Allowed: PDF, DOC, PPT, TXT, images. This will be the module document students download.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cover Image (recommended)</label>
            <div className="mt-1 flex items-center gap-3">
              <label htmlFor="picture" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm cursor-pointer hover:bg-gray-50">
                Choose Image
              </label>
              <input id="picture" type="file" name="picture" accept=".png,.jpg,.jpeg" onChange={(e) => setPicture(e.target.files[0])} className="hidden" />
              <div className="text-sm text-gray-600">{picture ? picture.name : 'No image selected'}</div>
            </div>
            {picture && (
              <div className="mt-2">
                <img src={URL.createObjectURL(picture)} alt="preview" className="w-32 h-20 object-cover rounded-md border" />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Recommended size: 800x450px (landscape).</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button type="submit" className="inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? 'Saving...' : editingModule ? 'Update Module' : 'Create Module'}
          </button>
          <button type="button" onClick={closeModal} className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;

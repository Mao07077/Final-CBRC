import React, { useState, useEffect } from "react";
import useModuleStore from "../../../../store/instructor/moduleStore";
import useAuthStore from '../../../../store/authStore';

const ModuleForm = () => {
  const { saveModule, editingModule, closeModal, isLoading } = useModuleStore();
  const { userData } = useAuthStore();
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    program: "",
    id_number: userData?.id_number || ""
  });
  const [file, setFile] = useState(null);
  const [picture, setPicture] = useState(null);

  useEffect(() => {
    if (editingModule) {
      setFormData({
        title: editingModule.title,
        topic: editingModule.topic,
        description: editingModule.description,
        program: editingModule.program,
        id_number: userData?.id_number || ""
      });
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

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {editingModule ? "Edit Module" : "Create New Module"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter module title"
            className="form-input"
            required
            aria-label="Module Title"
          />
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <input
            id="topic"
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="Enter module topic"
            className="form-input"
            required
            aria-label="Module Topic"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            id="description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Short description or summary"
            className="form-input"
            required
            aria-label="Module Description"
          />
        </div>

        <div>
          <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select
            id="program"
            name="program"
            value={formData.program}
            onChange={handleChange}
            className="form-input"
            required
            aria-label="Program"
          >
            <option value="">Select program</option>
            <option value="LET">LET</option>
            <option value="CSE">CSE</option>
            <option value="NLE">NLE</option>
          </select>
        </div>
        {/* id_number is hidden but always included */}
        <input
          type="hidden"
          name="id_number"
          value={formData.id_number}
        />
        <input
          type="file"
          name="document"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <input
          type="file"
          name="picture"
          accept=".png,.jpg,.jpeg"
          onChange={(e) => setPicture(e.target.files[0])}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Saving..." : editingModule ? "Update Module" : "Create Module"}
        </button>
        <button type="button" className="btn btn-secondary ml-2" onClick={closeModal}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ModuleForm;

import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import usePostStore from "../../../../store/admin/postStore";

const PostForm = () => {
  const { savePost, editingPost, closeModal, isLoading } = usePostStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
    } else {
      setTitle("");
      setContent("");
    }
    setImage(null);
  }, [editingPost]);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePost({ title, content, image });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      <div>
        <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
          required
        />
      </div>
      <div>
        <label htmlFor="post-image" className="block text-sm font-medium text-gray-700 mb-1">
          Featured Image (Optional)
        </label>
        <input
          id="post-image"
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          accept="image/*"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          className="bg-white border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={closeModal}
          className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Post"}
        </button>
      </div>
    </form>
  );
};

export default PostForm;

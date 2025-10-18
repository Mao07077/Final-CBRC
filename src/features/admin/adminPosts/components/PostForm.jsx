import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import usePostStore from "../../../../store/admin/postStore";
import { FiChevronLeft, FiChevronRight, FiX, FiArrowLeft, FiArrowRight } from "react-icons/fi";

const PostForm = () => {
  const { savePost, editingPost, closeModal, isLoading } = usePostStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
    } else {
      setTitle("");
      setContent("");
    }
    // If editingPost has image URLs, convert them to preview objects
    if (editingPost && editingPost.images && Array.isArray(editingPost.images) && editingPost.images.length > 0) {
      const mapped = editingPost.images.map((url) => ({ url, file: null }));
      setImages(mapped);
      setCurrentIdx(0);
    } else {
      setImages([]);
      setCurrentIdx(0);
    }
  }, [editingPost]);

  useEffect(() => {
    return () => {
      // revoke object urls
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePost({ title, content, images });
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((f) => {
      const u = URL.createObjectURL(f);
      objectUrlsRef.current.push(u);
      return { file: f, url: u };
    });
    setImages((prev) => {
      const merged = [...prev, ...newItems];
      return merged;
    });
    setCurrentIdx((prev) => (prev >= 0 ? prev : 0));
  };

  const removeImageAt = (index) => {
    setImages((prev) => {
      const removed = prev.filter((_, i) => i !== index);
      return removed;
    });
    setCurrentIdx((prev) => {
      if (images.length <= 1) return 0;
      if (index === prev && prev > 0) return prev - 1;
      if (prev >= images.length - 1) return images.length - 2 >= 0 ? images.length - 2 : 0;
      return prev;
    });
  };

  const moveImage = (from, to) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    if (currentIdx === from) setCurrentIdx(to);
    else if (from < currentIdx && to >= currentIdx) setCurrentIdx((i) => i - 1);
    else if (from > currentIdx && to <= currentIdx) setCurrentIdx((i) => i + 1);
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
        <label htmlFor="post-images" className="block text-sm font-medium text-gray-700 mb-1">
          Images (you can upload multiple) — images will appear in the main preview below and can be reordered or removed
        </label>
        <input
          id="post-images"
          type="file"
          onChange={handleFilesChange}
          className="w-full text-sm text-gray-500"
          accept="image/*"
          multiple
        />

        {/* Main image preview / carousel */}
        {images && images.length > 0 && (
          <div className="mt-4">
            <div className="relative bg-gray-100 rounded-md overflow-hidden h-64 flex items-center justify-center">
              <button type="button" onClick={() => setCurrentIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 bg-white/90 p-2 rounded-full shadow">
                <FiChevronLeft />
              </button>
              <div className="w-full h-full flex items-center justify-center">
                <img src={images[currentIdx].url} alt={`current-${currentIdx}`} className="max-h-full object-contain" />
              </div>
              <button type="button" onClick={() => setCurrentIdx((i) => (i + 1) % images.length)} className="absolute right-2 bg-white/90 p-2 rounded-full shadow">
                <FiChevronRight />
              </button>
            </div>

            {/* Controls */}
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => moveImage(currentIdx, currentIdx - 1)} disabled={currentIdx === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Move Left</button>
              <button type="button" onClick={() => moveImage(currentIdx, currentIdx + 1)} disabled={currentIdx === images.length - 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Move Right</button>
              <button type="button" onClick={() => removeImageAt(currentIdx)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Remove</button>
              <div className="ml-auto text-sm text-gray-600">Image {currentIdx + 1} of {images.length}</div>
            </div>

            {/* Thumbnails */}
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button key={idx} type="button" onClick={() => setCurrentIdx(idx)} className={`w-20 h-14 rounded overflow-hidden border ${idx === currentIdx ? 'ring-2 ring-indigo-400' : ''}`}>
                  <img src={img.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
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

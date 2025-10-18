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
  const quillRef = useRef(null);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
    } else {
      setTitle("");
      // Prefill editor with a 5W template so fields stay inside the editor
      const template = `
        <p><strong>Title:</strong> </p>
        <p><strong>Who:</strong> </p>
        <p><strong>What:</strong> </p>
        <p><strong>When:</strong> </p>
        <p><strong>Where:</strong> </p>
        <p><strong>Why:</strong> </p>
      `;
      setContent(template);
    }
  // If editingPost has image URLs, convert them to preview objects
    if (editingPost) {
      if (editingPost.images && Array.isArray(editingPost.images) && editingPost.images.length > 0) {
        const mapped = editingPost.images.map((url) => ({ url, file: null }));
        setImages(mapped);
        setCurrentIdx(0);
      } else if (editingPost.image) {
        // backward-compat: single image field
        setImages([{ url: editingPost.image, file: null }]);
        setCurrentIdx(0);
      } else {
        setImages([]);
        setCurrentIdx(0);
      }
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
    // Derive title from content if user didn't explicitly set one
    let derivedTitle = title;
    if (!derivedTitle) {
      const stripped = (content || "").replace(/<[^>]+>/g, '').trim();
      const firstLine = (stripped.split(/\r?\n/).find(l => l.trim().length > 0) || '').trim();
      derivedTitle = firstLine.slice(0, 120) || 'Untitled Post';
      setTitle(derivedTitle);
    }
    const extractedFiveW = extractFiveWFromContent(content);
    savePost({ title: derivedTitle, content, images, fiveW: extractedFiveW });
  };

  // Extract Title/Who/What/When/Where/Why from HTML content
  function extractFiveWFromContent(htmlContent) {
    if (!htmlContent) return null;
    const text = (htmlContent || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
    const labels = ['Title', 'Who', 'What', 'When', 'Where', 'Why'];
    const result = {};
    const lower = text.toLowerCase();
    labels.forEach((label) => {
      const key = label.toLowerCase();
      const idx = lower.indexOf((label + ':').toLowerCase());
      if (idx === -1) return;
      const start = idx + label.length + 1;
      // find next label position
      let end = text.length;
      for (const l of labels) {
        const otherIdx = lower.indexOf((l + ':').toLowerCase(), start);
        if (otherIdx !== -1) end = Math.min(end, otherIdx);
      }
      const raw = text.substring(start, end).trim();
      result[key] = raw;
    });
    return Object.keys(result).length ? result : null;
  }

  // derive candidate lines from content to let admin pick a title
  const getCandidateLines = () => {
    const stripped = (content || "").replace(/<[^>]+>/g, '').trim();
    if (!stripped) return [];
    // split by newlines first, then sentences as fallback
    let lines = stripped.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      lines = stripped.split(/\.\s+/).map(l => l.trim()).filter(Boolean);
    }
    return lines.slice(0, 6);
  };

  const candidateLines = getCandidateLines();

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

  // Move caret to label position inside the editor. If label not found, append it.
  function focusSection(label) {
    try {
      const quill = quillRef.current && quillRef.current.getEditor && quillRef.current.getEditor();
      if (!quill) return;
      const plain = quill.getText();
      const lower = plain.toLowerCase();
      const needle = (label + ':').toLowerCase();
      let pos = lower.indexOf(needle);
      if (pos === -1) {
        // append label at end
        const insertAt = quill.getLength() - 1;
        quill.insertText(insertAt, `\n${label}: `, 'user');
        pos = insertAt + 1; // position after newline
      } else {
        pos = pos + label.length + 1; // after 'Label:'
      }
      // set caret at the end of the label's separator (after the space)
      quill.setSelection(pos + 1, 0);
      quill.focus();
      // If label is Title, update title preview from that section
      if (label.toLowerCase() === 'title') {
        const five = extractFiveWFromContent(quill.root.innerHTML);
        if (five && five.title) setTitle(five.title.slice(0,120));
      }
    } catch (err) {
      // ignore
    }
  }

  return (
    <div className="max-h-[75vh] overflow-auto p-2">
      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Post (use the editor — pick a line below to set the Title)</label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            className="bg-white border border-gray-300 rounded-md min-h-[160px]"
          />
          <div className="mt-2 text-xs text-gray-600">Click an indicator to move the editor caret to that section:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Title','Who','What','When','Where','Why'].map((lbl) => (
              <button key={lbl} type="button" onClick={() => focusSection(lbl)} className="px-2 py-1 text-sm bg-gray-100 rounded border hover:bg-gray-200">{lbl}</button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600">Selected Title: <span className="font-semibold">{title || (extractFiveWFromContent(content)?.title) || '— not set —'}</span></div>
        </div>

        {/* fiveW is now stored inside the editor content; explicit fields removed */}

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
              <div className="relative bg-gray-100 rounded-md overflow-hidden h-64 sm:h-72 md:h-64 flex items-center justify-center">
                <button type="button" onClick={() => setCurrentIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 bg-white/90 p-2 rounded-full shadow">
                  <FiChevronLeft />
                </button>
                <div className="w-full h-full flex items-center justify-center">
                  <img src={images[currentIdx].url} alt={`current-${currentIdx}`} className="max-h-full object-contain bg-white" />
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
    </div>
  );
};

export default PostForm;

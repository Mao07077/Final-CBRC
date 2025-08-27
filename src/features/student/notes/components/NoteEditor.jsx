import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import useNotesStore from "../../../../store/student/notesStore";

const NoteEditor = () => {
  const {
    selectedNote,
    saveNote,
    deleteNote,
    isLoading,
    deselectNote,
  } = useNotesStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const userId = localStorage.getItem("userIdNumber");

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title || "");
      setContent(selectedNote.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [selectedNote]);

  const handleSave = () => {
    saveNote({ ...selectedNote, title, content });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNote(selectedNote._id);
    }
  };

  if (!selectedNote) return null;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center gap-2 mb-4">
        <button
          onClick={deselectNote}
          className="md:hidden p-2 rounded-full hover:bg-gray-200"
          aria-label="Back to notes list"
        >
          <FiArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-accent-medium text-white rounded-lg hover:bg-accent-dark disabled:bg-gray-400"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          {selectedNote._id && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title"
        className="text-2xl font-bold p-2 mb-4 bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-indigo-500"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note..."
        className="flex-grow p-2 bg-transparent focus:outline-none resize-none"
      />
    </div>
  );
};

export default NoteEditor;

import React, { useEffect, useMemo, useState } from "react";
import useNotesStore from "../../store/student/notesStore";
import NoteEditor from "../../features/student/notes/components/NoteEditor";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import Modal from "../../components/common/Modal";

const NotesPage = () => {
  const fetchNotes = useNotesStore((state) => state.fetchNotes);
  const notes = useNotesStore((state) => state.notes || []);
  const selectNote = useNotesStore((state) => state.selectNote);
  const deselectNote = useNotesStore((state) => state.deselectNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const createNewNote = useNotesStore((state) => state.createNewNote);
  const isLoading = useNotesStore((state) => state.isLoading);
  const error = useNotesStore((state) => state.error);

  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const title = (n.title || "").toLowerCase();
      const content = (n.content || "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [query, notes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
          <button
            onClick={() => { createNewNote(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            + New
          </button>
        </div>
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes by title or content"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {isLoading && !notes.length ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div key={note._id || note.id}
                   className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer group"
                   onClick={() => { selectNote(note._id || note.id); setIsModalOpen(true); }}>
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{note.title || "Untitled Note"}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{note.content || "No content"}</p>
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition mt-3">
                  <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={(e) => { e.stopPropagation(); selectNote(note._id || note.id); setIsModalOpen(true); }}
                    title="Edit"
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-red-100 text-red-600"
                    onClick={async (e) => { e.stopPropagation(); await deleteNote(note._id || note.id); }}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); deselectNote(); }}>
        <div className="w-full max-w-2xl">
          <ErrorBoundary>
            <NoteEditor />
          </ErrorBoundary>
        </div>
      </Modal>
    </div>
  );
};

export default NotesPage;

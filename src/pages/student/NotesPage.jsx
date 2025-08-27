import React, { useEffect } from "react";
import useNotesStore from "../../store/student/notesStore";
import NoteList from "../../features/student/notes/components/NoteList";
import NoteEditor from "../../features/student/notes/components/NoteEditor";
import ErrorBoundary from "../../components/common/ErrorBoundary";

const NotesPage = () => {
  const fetchNotes = useNotesStore((state) => state.fetchNotes);
  const selectedNote = useNotesStore((state) => state.selectedNote);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* NoteList Panel */}
      <div
        className={`w-full md:w-1/3 md:flex-shrink-0 md:border-r md:border-gray-200 ${
          selectedNote ? 'hidden md:block' : 'block'
        }`}
      >
        <ErrorBoundary>
          <NoteList />
        </ErrorBoundary>
      </div>

      {/* NoteEditor Panel */}
      <div className={`w-full ${selectedNote ? 'block' : 'hidden md:block'}`}>
        {selectedNote ? (
          <ErrorBoundary>
            <NoteEditor />
          </ErrorBoundary>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500">
            <h3 className="text-lg font-semibold">Select a note</h3>
            <p>Choose a note from the list to view or edit it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;

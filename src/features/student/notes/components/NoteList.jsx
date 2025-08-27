import React from "react";
import useNotesStore from "../../../../store/student/notesStore";

const NoteList = () => {
  const notes = useNotesStore((state) => state.notes || []);
  const selectNote = useNotesStore((state) => state.selectNote);
  const selectedNote = useNotesStore((state) => state.selectedNote);
  const createNewNote = useNotesStore((state) => state.createNewNote);
  const isLoading = useNotesStore((state) => state.isLoading);
  const error = useNotesStore((state) => state.error);

  if (error) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-dark">My Notes</h2>
          <button
            onClick={createNewNote}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            + New
          </button>
        </div>
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-dark">My Notes</h2>
        <button
          onClick={createNewNote}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          + New
        </button>
      </div>
      {isLoading && !notes.length ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {notes.map((note) => (
            <li
              key={note._id || note.id || Math.random()}
              onClick={() => selectNote(note._id || note.id)}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedNote?._id === (note._id || note.id)
                  ? "bg-primary-light"
                  : "hover:bg-gray-100"
              }`}
            >
              <h3 className="font-semibold truncate">
                {note.title || "Untitled Note"}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {note.content || "No content"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NoteList;

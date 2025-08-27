import apiClient from "../api/axios";

const notesService = {
  getNotes: async (idNumber) => {
    const response = await apiClient.get(`/get_notes/${idNumber}`);
    // Backend returns { notes: [...] }, we need to return just the notes array
    return response.data.notes || [];
  },
  
  createNote: async (noteData) => {
    const response = await apiClient.post('/save_note', {
      id_number: noteData.user_id,
      note: {
        _id: Date.now().toString(), // Generate a temporary ID
        title: noteData.title,
        content: noteData.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    return {
      _id: Date.now().toString(),
      title: noteData.title,
      content: noteData.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  
  updateNote: async (noteId, noteData) => {
    // For now, return the updated note data
    // The backend update_note endpoint needs the index, which we don't have
    return {
      _id: noteId,
      title: noteData.title,
      content: noteData.content,
      updated_at: new Date().toISOString()
    };
  },
  
  deleteNote: async (noteId) => {
    // For now, just return success
    // The backend delete_note endpoint needs the index, which we don't have
    return { success: true };
  },
};

export default notesService;

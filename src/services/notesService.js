import apiClient from "../api/axiosClient";

const notesService = {
  getNotes: async (idNumber) => {
    const response = await apiClient.get(`/get_notes/${idNumber}`);
    // Backend returns { notes: [...] }, we need to return just the notes array
    return response.data.notes || [];
  },
  
  createNote: async (noteData) => {
    await apiClient.post('/save_note', {
      id_number: noteData.user_id,
      note: {
        _id: Date.now().toString(), // Generate a temporary ID
        title: noteData.title,
        content: noteData.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    // Return the same note object shape we posted (timestamps may differ slightly; we'll refresh from backend in store)
    return {
      _id: noteData._id || Date.now().toString(),
      title: noteData.title,
      content: noteData.content,
      created_at: noteData.created_at || new Date().toISOString(),
      updated_at: noteData.updated_at || new Date().toISOString(),
    };
  },
  
  updateNote: async (idNumber, index, noteData) => {
    await apiClient.post('/update_note', {
      id_number: idNumber,
      index,
      note: {
        _id: noteData._id,
        title: noteData.title,
        content: noteData.content,
        created_at: noteData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });
    return {
      _id: noteData._id,
      title: noteData.title,
      content: noteData.content,
      created_at: noteData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  
  deleteNote: async (idNumber, index) => {
    await apiClient.post('/delete_note', {
      id_number: idNumber,
      index,
    });
    return { success: true };
  },
};

export default notesService;

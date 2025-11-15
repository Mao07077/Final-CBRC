import { create } from "zustand";
import apiClient from "../../api/axiosClient";

const initialRowFromFile = (file) => {
  const name = file?.name || "Untitled";
  const title = name.replace(/\.[^.]+$/, "");
  return {
    file,
    cover: null,
    title,
    topic: "",
    description: "",
    program: "",
    assigned: [], // array of instructor id_numbers
  // Removed scheduling/publish controls; instructor handles scheduling
  scheduleAt: "",
  };
};

const useBatchModuleStore = create((set, get) => ({
  instructors: [],
  rows: [],
  isLoading: false,
  error: null,
  success: null,

  fetchInstructors: async () => {
    try {
      const res = await apiClient.get("/api/instructors");
      const list = (res.data || []).map((i) => ({
        id: i.id_number,
        name: `${i.firstname || ""} ${i.lastname || ""}`.trim(),
        program: i.program || "",
      }));
      set({ instructors: list });
    } catch (e) {
      // non-fatal
    }
  },

  setFiles: (fileList) => {
    const files = Array.from(fileList || []);
    const rows = files.map((f) => initialRowFromFile(f));
    set({ rows });
  },

  updateRow: (index, patch) => {
    const rows = [...get().rows];
    rows[index] = { ...rows[index], ...patch };
    set({ rows });
  },

  removeRow: (index) => {
    const rows = [...get().rows];
    rows.splice(index, 1);
    set({ rows });
  },

  submitBatch: async (creatorId) => {
    const { rows } = get();
    if (!rows.length) return;
    set({ isLoading: true, error: null, success: null });
    try {
      const fd = new FormData();
      fd.append("id_number", creatorId || "");
      rows.forEach((r) => {
        fd.append("titles", r.title || "");
        fd.append("topics", r.topic || "");
        fd.append("descriptions", r.description || "");
        fd.append("programs", r.program || "");
        // assigned_instructor_ids is a comma-separated string per index
        fd.append("assigned_instructor_ids", (r.assigned || []).join(","));
        // schedule and publish flags
        // Admin no longer sets publish or schedule; send empty placeholders
        fd.append("is_published_list", "");
        fd.append("publish_ats", "");
        // files
        fd.append("documents", r.file);
        fd.append("pictures", r.cover);
      });

      await apiClient.post("/api/admin/modules/batch_create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ isLoading: false, success: "Modules uploaded successfully", rows: [] });
    } catch (e) {
      set({ isLoading: false, error: e?.response?.data?.detail || e.message || "Batch upload failed" });
    }
  },
}));

export default useBatchModuleStore;

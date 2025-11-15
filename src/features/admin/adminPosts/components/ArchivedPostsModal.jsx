import React, { useEffect } from "react";
import Modal from "../../../../components/common/Modal";
import usePostStore from "../../../../store/admin/postStore";

const ArchivedPostsModal = ({ isOpen, onClose }) => {
  const { archivedPosts, fetchArchivedPosts, unarchivePost, isLoading } = usePostStore();

  useEffect(() => {
    if (isOpen) fetchArchivedPosts();
  }, [isOpen, fetchArchivedPosts]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archived Posts" maxWidth="max-w-4xl">
      {isLoading && <div className="text-sm text-gray-600">Loading archived posts...</div>}
      {!isLoading && (!archivedPosts || archivedPosts.length === 0) && (
        <div className="text-sm text-gray-600">No archived posts.</div>
      )}
      {!isLoading && archivedPosts && archivedPosts.length > 0 && (
        <div className="space-y-3">
          {archivedPosts.map((p) => (
            <div key={p._id} className="flex items-center justify-between bg-gray-50 rounded border p-3">
              <div>
                <div className="font-semibold text-gray-900">{p.title || p?.fiveW?.title || "Untitled"}</div>
                <div className="text-xs text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "No date"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => unarchivePost(p._id)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Restore
                </button>
              </div>
            </div>)
          )}
        </div>
      )}
    </Modal>
  );
};

export default ArchivedPostsModal;

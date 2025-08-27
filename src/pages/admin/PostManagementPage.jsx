import { useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import usePostStore from "../../store/admin/postStore";
import PostsTable from "../../features/admin/adminPosts/components/PostsTable";
import PostForm from "../../features/admin/adminPosts/components/PostForm";
import Modal from "../../components/common/Modal";

const PostManagementPage = () => {
  const {
    posts,
    fetchPosts,
    isLoading,
    error,
    isModalOpen,
    openModal,
    closeModal,
    editingPost,
  } = usePostStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-dark">
          Post Management
        </h1>
        <button
          onClick={() => openModal(null)}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300"
        >
          <FiPlus className="mr-2" /> Create Post
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg my-4">{error}</p>}
      
      {isLoading && !posts.length ? (
        <p>Loading posts...</p>
      ) : (
        <PostsTable posts={posts} />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingPost ? "Edit Post" : "Create New Post"}
      >
        <PostForm />
      </Modal>
    </div>
  );
};

export default PostManagementPage;

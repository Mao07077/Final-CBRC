import { FiEdit, FiTrash2 } from "react-icons/fi";
import usePostStore from "../../../../store/admin/postStore";

const PostsTable = ({ posts }) => {
  const { openModal, deletePost } = usePostStore();

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Table for medium and larger screens */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Title</th>
              <th scope="col" className="px-6 py-3">Created At</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                <td className="px-6 py-4">{new Date(post.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  <button onClick={() => openModal(post)} className="p-2 text-gray-500 hover:text-indigo-600">
                    <FiEdit />
                  </button>
                  <button onClick={() => deletePost(post._id)} className="p-2 text-gray-500 hover:text-red-600">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <div className="md:hidden">
        {posts.map((post) => (
          <div key={post._id} className="border-b p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-gray-900">{post.title}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => openModal(post)} className="p-2 text-gray-500 hover:text-indigo-600">
                  <FiEdit />
                </button>
                <button onClick={() => deletePost(post._id)} className="p-2 text-gray-500 hover:text-red-600">
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Created: {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsTable;

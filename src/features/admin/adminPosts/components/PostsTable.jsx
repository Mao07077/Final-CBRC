import { FiEdit, FiTrash2 } from "react-icons/fi";
import usePostStore from "../../../../store/admin/postStore";

const PostsTable = ({ posts }) => {
  const { openModal, deletePost } = usePostStore();

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post._id} className="relative bg-white rounded-lg shadow-md overflow-hidden group">
            {post.image && (
              <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{post.title}</h3>
              <p className="text-sm text-gray-700 mb-3">{(post.content || '').replace(/<[^>]+>/g, '').slice(0, 140)}{(post.content || '').replace(/<[^>]+>/g, '').length > 140 ? '...' : ''}</p>
              <div className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'No date'}</div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(post)} className="p-2 bg-white rounded-full shadow text-indigo-600 mr-2"><FiEdit /></button>
              <button onClick={() => deletePost(post._id)} className="p-2 bg-white rounded-full shadow text-red-600"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsTable;

const UserList = ({ title, users, isLoading }) => {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user) => (
              <li key={user._id} className="text-gray-700">
                {user.name || `${user.firstname} ${user.lastname}`}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No users found.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default UserList;

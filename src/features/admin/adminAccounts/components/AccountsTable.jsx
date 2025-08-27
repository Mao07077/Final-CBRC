import { FiEdit, FiTrash2 } from "react-icons/fi";
import useAccountStore from "../../../../store/admin/accountStore";

const AccountsTable = ({ accounts, selectedIds, onSelectionChange }) => {
  const { openModal, deleteAccount } = useAccountStore();

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(accounts.map((acc) => acc._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id) => {
    onSelectionChange((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Table for medium and larger screens */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="p-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                  onChange={handleSelectAll}
                  checked={selectedIds.length === accounts.length && accounts.length > 0}
                />
              </th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">ID Number</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc._id} className="bg-white border-b hover:bg-gray-50">
                <td className="w-4 p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                    checked={selectedIds.includes(acc._id)}
                    onChange={() => handleSelectOne(acc._id)}
                  />
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{acc.firstname} {acc.lastname}</td>
                <td className="px-6 py-4">{acc.id_number}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${{
                      admin: "bg-blue-100 text-blue-800",
                      instructor: "bg-green-100 text-green-800",
                      student: "bg-yellow-100 text-yellow-800",
                    }[acc.role] || "bg-gray-100 text-gray-800"}`}
                  >
                    {acc.role}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button onClick={() => openModal(acc)} className="p-2 text-gray-500 hover:text-indigo-600"><FiEdit /></button>
                  <button onClick={() => deleteAccount(acc._id)} className="p-2 text-gray-500 hover:text-red-600"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <div className="md:hidden">
        {accounts.map((acc) => (
          <div key={acc._id} className="border-b p-4 flex items-start gap-4">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
              checked={selectedIds.includes(acc._id)}
              onChange={() => handleSelectOne(acc._id)}
            />
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-gray-900">{acc.firstname} {acc.lastname}</p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${{
                    admin: "bg-blue-100 text-blue-800",
                    instructor: "bg-green-100 text-green-800",
                    student: "bg-yellow-100 text-yellow-800",
                  }[acc.role] || "bg-gray-100 text-gray-800"}`}
                >
                  {acc.role}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID: {acc.id_number}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => openModal(acc)} className="p-2 text-gray-500 hover:text-indigo-600"><FiEdit className="mr-1"/> Edit</button>
                <button onClick={() => deleteAccount(acc._id)} className="p-2 text-gray-500 hover:text-red-600"><FiTrash2 className="mr-1"/> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsTable;

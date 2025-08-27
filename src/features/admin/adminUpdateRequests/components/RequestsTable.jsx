import useRequestStore from "../../../../store/admin/requestStore";

const RequestsTable = () => {
  const { requests, viewRequest } = useRequestStore();

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Table for medium and larger screens */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Account No.</th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr key={request._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{request.id_number}</td>
                  <td className="px-6 py-4">{`${request.firstname} ${request.lastname}`}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => viewRequest(request)}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-500">
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <div className="md:hidden">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request._id} className="border-b p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-gray-900">{`${request.firstname} ${request.lastname}`}</p>
                <p className="text-sm text-gray-600">ID: {request.id_number}</p>
              </div>
              <button
                onClick={() => viewRequest(request)}
                className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300"
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-gray-500">No pending requests.</p>
        )}
      </div>
    </div>
  );
};

export default RequestsTable;

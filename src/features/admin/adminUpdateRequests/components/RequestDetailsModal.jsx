import useRequestStore from "../../../../store/admin/requestStore";
import Modal from "../../../../components/common/Modal";

const DetailRow = ({ label, oldValue, newValue }) => (
  <div className="py-3 sm:py-4 border-b last:border-b-0">
    <p className="text-sm font-medium text-gray-800 mb-1">{label}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
      <div className="text-sm">
        <span className="text-gray-500">Current: </span>
        <span className="text-gray-700">{oldValue || "N/A"}</span>
      </div>
      <div className="text-sm">
        <span className="text-green-600 font-semibold">New: </span>
        <span className="text-green-700 font-bold">{newValue}</span>
      </div>
    </div>
  </div>
);

const RequestDetailsModal = () => {
  const { selectedRequest, closeModal, acceptRequest, declineRequest } =
    useRequestStore();

  if (!selectedRequest) return null;

  const { _id, id_number, firstname, lastname, program, update_data } =
    selectedRequest;

  return (
    <Modal
      isOpen={!!selectedRequest}
      onClose={closeModal}
      title={`Update Request: ${firstname} ${lastname}`}
    >
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-4">Review the requested changes for ID: <span className="font-semibold">{id_number}</span></p>
        
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
          {Object.keys(update_data).map((key) => (
            <DetailRow
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              oldValue={selectedRequest[key]}
              newValue={update_data[key]}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={closeModal}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300"
          >
            Cancel
          </button>
          <button
            onClick={() => declineRequest(_id)}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors duration-300"
          >
            Decline
          </button>
          <button
            onClick={() => acceptRequest(_id)}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors duration-300"
          >
            Accept
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RequestDetailsModal;

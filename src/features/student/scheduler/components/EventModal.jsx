import React, { useState, useEffect } from "react";
import useSchedulerStore from "../../../../store/student/schedulerStore";

const EventModal = () => {
  const { isModalOpen, closeModal, selectedEvent, addEvent, updateEvent } =
    useSchedulerStore();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (selectedEvent && selectedEvent.title) {
      setTitle(selectedEvent.title);
    } else {
      setTitle("");
    }
  }, [selectedEvent]);

  if (!isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = { ...selectedEvent, title };
    if (selectedEvent && selectedEvent.id) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }
    closeModal();
  };

  return (
    // The z-50 class ensures the modal appears above all other content.
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {selectedEvent && selectedEvent.id ? "Edit Event" : "Add Event"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event Title"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;

import { create } from "zustand";
import scheduleService from "../../services/scheduleService";
import useAuthStore from "../authStore";

const getInitialEvents = () => {
  const now = new Date();
  return [
    {
      id: 1,
      title: "Review General Education Concepts",
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10,
        0,
        0
      ),
      end: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        11,
        30,
        0
      ),
      resourceId: "gen-ed",
    },
    {
      id: 2,
      title: "Practice Majorship Exam",
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        14,
        0,
        0
      ),
      end: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        16,
        0,
        0
      ),
      resourceId: "majorship",
    },
  ];
};

const useSchedulerStore = create((set, get) => ({
  events: [],
  isModalOpen: false,
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      // Backend returns schedule as array of arrays: [title, start, end]
      const scheduleArr = await scheduleService.getSchedules(userData.id_number);
      const formattedEvents = Array.isArray(scheduleArr)
        ? scheduleArr.map((item, idx) => ({
            id: idx + 1,
            title: item[0],
            start: new Date(item[1]),
            end: new Date(item[2]),
            resourceId: item[3] || undefined
          }))
        : [];

      set({ events: formattedEvents, isLoading: false });
    } catch (error) {
      console.error("Schedule fetch error:", error);
      // Fallback to initial events if API fails
      set({ 
        events: getInitialEvents(), 
        isLoading: false, 
        error: "Failed to load schedule, using cached data" 
      });
    }
  },

  openModal: (event) =>
    set({ isModalOpen: true, selectedEvent: event || null }),
  closeModal: () => set({ isModalOpen: false, selectedEvent: null }),

  addEvent: async (event) => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      // Build payload for ScheduleEntry model
      // For single event, wrap in schedule array and times array
      const schedule = [[event.title, event.start.toISOString(), event.end.toISOString()]];
      const times = [`${event.start.getHours()}:${event.start.getMinutes()}-${event.end.getHours()}:${event.end.getMinutes()}`];
      const eventPayload = {
        id_number: userData.id_number,
        schedule,
        times
      };

      const savedEvent = await scheduleService.createSchedule(eventPayload);
      set((state) => ({
        events: [...state.events, {
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }],
        isLoading: false
      }));
    } catch (error) {
      console.error("Add event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to add event" 
      });
    }
  },

  updateEvent: async (updatedEvent) => {
    set({ isLoading: true, error: null });
    try {
      const savedEvent = await scheduleService.updateSchedule(updatedEvent.id, updatedEvent);
      set((state) => ({
        events: state.events.map((event) =>
          event.id === updatedEvent.id ? {
            ...savedEvent,
            start: new Date(savedEvent.start),
            end: new Date(savedEvent.end)
          } : event
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error("Update event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to update event" 
      });
    }
  },

  deleteEvent: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      await scheduleService.deleteSchedule(eventId);
      set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
        isLoading: false
      }));
    } catch (error) {
      console.error("Delete event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to delete event" 
      });
    }
  },
}));

export default useSchedulerStore;

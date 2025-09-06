import React, { useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import enUS from "date-fns/locale/en-US";
import useSchedulerStore from "../../store/student/schedulerStore";
import EventModal from "../../features/student/scheduler/components/EventModal";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SchedulerPage = () => {
  const { events, openModal, fetchEvents } = useSchedulerStore();
  const notifiedEventsRef = useRef({});

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Notification logic
  useEffect(() => {
    // Request notification permission on mount
    if (Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach((event) => {
        const start = new Date(event.start);
        const diffMs = start - now;
        const diffMins = Math.floor(diffMs / 60000);
        // 1 hour before
        if (diffMins === 60 && !notifiedEventsRef.current[`${event.id}-1hr`]) {
          new Notification(`Upcoming Event: ${event.title}`, {
            body: `Starts in 1 hour at ${start.toLocaleTimeString()}`,
          });
          notifiedEventsRef.current[`${event.id}-1hr`] = true;
        }
        // At event time
        if (diffMins === 0 && !notifiedEventsRef.current[`${event.id}-ontime`]) {
          new Notification(`Event Starting Now: ${event.title}`, {
            body: `It's time for your event! (${start.toLocaleTimeString()})`,
          });
          notifiedEventsRef.current[`${event.id}-ontime`] = true;
        }
      });
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [events]);

  const handleSelectSlot = ({ start, end }) => {
    openModal({ start, end });
  };

  const handleSelectEvent = (event) => {
    openModal(event);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Study Scheduler
      </h1>
      <div className="bg-white p-4 rounded-lg shadow-md h-[75vh]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          views={{ month: true, agenda: true }}
          defaultView={Views.MONTH}
          toolbar={true}
        />
      </div>
      <EventModal />
    </div>
  );
};

export default SchedulerPage;

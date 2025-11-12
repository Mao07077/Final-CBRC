// Add a notification sound using a public sound link
const notificationAudio = typeof Audio !== 'undefined' ? new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg') : null;
import React, { useEffect, useMemo, useRef, useState } from "react";
// ...existing code...
// ...existing code...
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
  // Removed test browser notification feature
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => (e.title || "").toLowerCase().includes(q));
  }, [events, query]);

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
          if (Notification && Notification.permission === "granted") {
            new Notification(`Upcoming Event: ${event.title}`, {
              body: `Starts in 1 hour at ${start.toLocaleTimeString()}`,
            });
            if (notificationAudio) notificationAudio.play();
            console.warn(`[CBRC Scheduler] Browser notification: Upcoming Event: ${event.title} (1 hour before)`);
          } else {
            console.warn(`[CBRC Scheduler] Notification blocked or not granted for Upcoming Event: ${event.title}`);
          }
          notifiedEventsRef.current[`${event.id}-1hr`] = true;
        }
        // At event time
        if (diffMins === 0 && !notifiedEventsRef.current[`${event.id}-ontime`]) {
          if (Notification && Notification.permission === "granted") {
            new Notification(`Event Starting Now: ${event.title}`, {
              body: `It's time for your event! (${start.toLocaleTimeString()})`,
            });
            if (notificationAudio) notificationAudio.play();
            console.warn(`[CBRC Scheduler] Browser notification: Event Starting Now: ${event.title}`);
          } else {
            console.warn(`[CBRC Scheduler] Notification blocked or not granted for Event Starting Now: ${event.title}`);
          }
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
      {/* Test browser notification removed */}
      <div className="bg-white p-4 rounded-lg shadow-md h-[75vh]">
        <div className="mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by title"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
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

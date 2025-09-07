import React, { useEffect, useRef } from "react";
import useSchedulerStore from "./store/student/schedulerStore";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import GlobalAuth from "./components/auth/GlobalAuth";
import { ChatProvider } from "./context/ChatProvider";
import useAuthStore from "./store/authStore";


// Notification sound
const notificationAudio = typeof Audio !== 'undefined' ? new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg') : null;


function App() {
  const { isAuthenticated, userRole } = useAuthStore();
  const { events, fetchEvents } = useSchedulerStore();
  const notifiedEventsRef = useRef({});

  // Only fetch events and run notifications for students
  useEffect(() => {
    if (isAuthenticated && userRole === "student") fetchEvents();
  }, [isAuthenticated, userRole, fetchEvents]);

  useEffect(() => {
    if (!isAuthenticated || userRole !== "student") return;
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
          }
          notifiedEventsRef.current[`${event.id}-ontime`] = true;
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, userRole, events]);

  return (
    <GlobalAuth>
      <ChatProvider>
        <div className="App">
          <Navbar />
          <main>
            <AppRoutes />
          </main>
          {!isAuthenticated && <Footer />}
        </div>
      </ChatProvider>
    </GlobalAuth>
  );
}

export default App;

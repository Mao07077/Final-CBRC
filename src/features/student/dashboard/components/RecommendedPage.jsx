import React from "react";
import { Link } from "react-router-dom";
import useDashboardStore from "../../../../store/student/dashboardStore";

// Map page slugs to display names and icons
const pageDetails = {
  "learn-together": { name: "Learn Together", icon: "👥", route: "/student/learn-together" },
  "instructor-chat": { name: "Instructor Chat", icon: "💬", route: "/student/messages" },
  modules: { name: "Modules", icon: "📚", route: "/student/modules" },
  scheduler: { name: "Scheduler", icon: "📅", route: "/student/scheduler" },
  notes: { name: "Notes", icon: "📝", route: "/student/notes" },
  flashcards: { name: "Flashcards", icon: "🃏", route: "/student/flashcards" },
  // Alias singular slug if older backend sends "flashcard"
  flashcard: { name: "Flashcards", icon: "🃏", route: "/student/flashcards" },
  "music-player": { name: "Study Music", icon: "🎵", route: "/student/music-player" },
  music: { name: "Study Music", icon: "🎵", route: "/student/music-player" },
};

const RecommendedPages = () => {
  const { recommendedPages } = useDashboardStore();

  // Show exactly 3 items; filter to valid slugs, then slice
  const pages = (recommendedPages || []).filter((slug) => pageDetails[slug]).slice(0, 3);

  if (pages.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-dark mb-4">
        Recommended For You
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {pages.map((pageSlug) => {
          const details = pageDetails[pageSlug];
          if (!details) return null;

          return (
            <Link
              to={details.route}
              key={pageSlug}
              className="block p-4 bg-light-blue rounded-lg text-center hover:bg-blue-200 transition-colors"
            >
              <div className="text-4xl mb-2">{details.icon}</div>
              <span className="font-semibold text-primary-dark">
                {details.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedPages;

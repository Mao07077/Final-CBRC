import React, { useMemo } from "react";
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
  "music-player": { name: "Study With Music", icon: "🎵", route: "/student/music-player" },
  music: { name: "Study With Music", icon: "🎵", route: "/student/music-player" },
};

const RecommendedPages = () => {
  const { recommendedPages } = useDashboardStore();

  // Normalize incoming slugs (e.g. 'messages' -> 'instructor-chat', 'music'/'music-player')
  const normalizeSlug = (slug) => {
    if (!slug) return slug;
    if (slug === 'messages') return 'instructor-chat';
    if (slug === 'flashcard') return 'flashcards';
    if (slug === 'music') return 'music-player';
    return slug;
  };

  const pages = useMemo(() => {
    const incoming = (recommendedPages || []).map(normalizeSlug).filter(Boolean);
    const unique = [];
    for (const slug of incoming) {
      if (!unique.includes(slug)) unique.push(slug);
    }
    // Filter to ones we can map
    let mapped = unique.filter((slug) => pageDetails[slug]);
    // Fallback ordering to ensure 3
    const fallbackOrder = ["modules", "scheduler", "flashcards", "learn-together", "notes", "music-player"];
    for (const fb of fallbackOrder) {
      if (mapped.length >= 3) break;
      if (!mapped.includes(fb) && pageDetails[fb]) mapped.push(fb);
    }
    return mapped.slice(0, 3);
  }, [recommendedPages]);

  if (pages.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-dark mb-4" title="Shortcuts to pages that match your study habits.">
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
              className="group block p-4 bg-light-blue rounded-lg text-center hover:bg-blue-200 transition-colors"
              title={`Go to ${details.name}`}
            >
              <div className="text-4xl mb-2">{details.icon}</div>
              <span className="font-semibold text-primary-dark group-hover:underline">
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

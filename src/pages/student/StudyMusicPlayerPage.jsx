import React from "react";
import EnhancedMusicPlayer from "../../features/student/musicPlayer/components/EnhancedMusicPlayer";

const StudyMusicPlayerPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedMusicPlayer />
      {/* Extra bottom space for fixed player on small screens */}
      <div className="h-40 sm:h-32" />
    </div>
  );
};

export default StudyMusicPlayerPage;

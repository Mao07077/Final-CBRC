import React from "react";
import useFlashcardStore from "../../../../store/student/flashcardStore";

const Flashcard = ({ card }) => {
  const { isFlipped, flipCard } = useFlashcardStore();

  return (
    <div
      className="perspective-1000 h-80 w-full cursor-pointer"
      onClick={flipCard}
    >
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white rounded-2xl shadow-lg border-2 border-primary transform-gpu">
          <p className="text-2xl text-center text-gray-800">{card.question}</p>
        </div>
        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 bg-primary-light rounded-2xl shadow-lg transform-gpu">
          <p className="text-xl text-center text-primary-dark font-semibold">
            {card.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;

"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa";

export const StarRating: React.FC<{
  rating: number;
  setRating?: (rating: number) => void;
  isReadOnly?: boolean;
}> = ({ rating = 0, setRating, isReadOnly }) => {
  const [internalRating, setInternalRating] = useState(rating);

  const handleRating = (star: number) => {
    if (setRating) {
      setRating(star);
    } else {
      setInternalRating(star);
    }
  };

  return (
    <div className="w-full flex justify-around px-10">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={30}
          className={`cursor-pointer ${
            star <= (setRating ? rating : internalRating)
              ? "text-yellow-500"
              : "text-gray-300"
          }`}
          onClick={() => {
            if (!isReadOnly) handleRating(star);
          }}
        />
      ))}
    </div>
  );
};

export default StarRating;

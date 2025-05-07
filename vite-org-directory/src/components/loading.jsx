import React from "react";
import { DotSpinner } from "ldrs/react";
import "ldrs/react/DotSpinner.css";

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center space-y-4">
        <DotSpinner size="40" speed="0.9" color="maroon" />
        <p className="text-maroon font-semibold text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;

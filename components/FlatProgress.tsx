"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

export function FlatProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  return (
    <div className="flex items-center gap-4 w-full justify-end">
      {progress === 100 && <Check size={16} color="black" />}
      <Progress value={progress} className="w-[150px] h-2" />
    </div>
  );
}

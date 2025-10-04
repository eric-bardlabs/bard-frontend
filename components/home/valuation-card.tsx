import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ValuationCardProps {
  onOpen: () => void;
}

export const ValuationCard: React.FC<ValuationCardProps> = ({ onOpen }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="text-lg font-normal text-default-700 uppercase mb-6 text-left w-full">
        Catalog Valuation
      </h3>
      
      <div className="w-full mb-8">
        <p className="text-3xl font-semibold text-[#c0beb8] filter blur-md select-none">
          $8,642,187 - $10,370,624
        </p>
      </div>
      
      <div 
        onClick={onOpen}
        className="w-full text-center cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-3 px-4 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200"
      >
        Click to see the valuation of your catalog
      </div>
    </div>
  );
};
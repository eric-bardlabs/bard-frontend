import React from "react";
import { Input, Divider, NumberInput } from "@heroui/react";
import { Icon } from "@iconify/react";

interface EarningsInputProps {
  label: string;
  icon: string;
  values?: { tlm: number; lifetime: number };
  onChange?: (values: { tlm: number; lifetime: number }) => void;
}

export const EarningsInput: React.FC<EarningsInputProps> = ({ 
  label, 
  icon, 
  values = { tlm: 0, lifetime: 0 },
  onChange = () => {}
}) => {
  const handleTlmChange = (value: number) => {
    onChange({ ...values, tlm: value });
  };
  
  const handleLifetimeChange = (value: number) => {
    onChange({ ...values, lifetime: value });
  };
  
  return (
    <div className="space-y-2">
      <label className="text-small font-medium">{label}</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumberInput
          placeholder="0"
          label="TLM (12 months)"
          hideStepper={true}
          value={values.tlm}
          onValueChange={handleTlmChange}
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
          size="sm"
        />
        <NumberInput
          placeholder="0"
          label="Lifetime"
          hideStepper
          value={values.lifetime}
          onValueChange={handleLifetimeChange}
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
          size="sm"
        />
      </div>
    </div>
  );
};
import React from "react";
import { Card, CardBody, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";

interface MetricCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: string;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  percentage,
  icon,
  color
}) => {
  return (
    <Card className="border border-default-100">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-medium font-medium">{title}</h3>
          <div className={`w-8 h-8 rounded-full bg-${color}/10 flex items-center justify-center`}>
            <Icon icon={icon} className={`text-${color} text-lg`} />
          </div>
        </div>
        
        <div className="mb-3">
          <span className="text-2xl font-semibold">{value}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-small text-default-500">Completion</span>
            <span className="text-small font-medium">{percentage}%</span>
          </div>
          <Progress 
            aria-label={`${title} completion`}
            value={percentage} 
            color={color}
            className="h-2"
          />
        </div>
      </CardBody>
    </Card>
  );
};
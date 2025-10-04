import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ProjectSummaryProps {
  songsImported: number;
  totalSongs: number;
  collaboratorsImported: number;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  songsImported,
  totalSongs,
  collaboratorsImported
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="bg-content2 border-none shadow-none">
        <CardBody className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
              <Icon icon="lucide:music" className="text-primary text-xl" />
            </div>
            <div>
              <p className="text-default-500 text-sm">Songs Imported</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{songsImported}</span>
                <span className="text-default-400 text-sm ml-1">/ {totalSongs}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-content2 border-none shadow-none">
        <CardBody className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mr-4">
              <Icon icon="lucide:users" className="text-secondary text-xl" />
            </div>
            <div>
              <p className="text-default-500 text-sm">Collaborators Imported</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{collaboratorsImported}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
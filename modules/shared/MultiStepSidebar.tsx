"use client";

import React from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

// import {cn} from "./cn";
// import SupportCard from "./support-card";
import VerticalSteps from "./VerticalSteps";

import RowSteps from "./RowSteps";
import MultistepNavigationButtons from "./MultiStepNavigationButtons";

export type MultiStepSidebarProps = React.HTMLAttributes<HTMLDivElement> & {  currentPage: number;
  onBack: () => void;
  onNext: () => void;
  onChangePage: (page: number) => void;
};

const MultiStepSidebar = React.forwardRef<HTMLDivElement, MultiStepSidebarProps>(
  ({children, className, currentPage, onBack, onNext, onChangePage, ...props}, ref) => {
    return (
      <div
        ref={ref}
        className={"flex h-[calc(100vh_-_40px)] w-full gap-x-2"}
        {...props}
      >
        <div className="flex hidden h-full w-[344px] flex-shrink-0 flex-col items-start gap-y-8 rounded-large bg-gradient-to-b from-default-100 via-danger-100 to-secondary-100 px-8 py-6 shadow-small lg:flex">
          <div>
            <div className="text-xl font-medium leading-7 text-default-foreground">
               Import Your Data Into Bard
            </div>
            <div className="mt-1 text-base font-medium leading-6 text-default-500">
              Get all your collaborators, projects, songs into Bard in just a few steps.
            </div>
          </div>
          {/* Desktop Steps */}
          <VerticalSteps
            // className={stepperClasses}
            color="secondary"
            currentStep={currentPage}
            steps={[
              {
                title: "Import your Collaborators",
                description: "Import your Collaborators",
              },
              {
                title: "Albums",
                description: "Upload your Albums",
              },
              {
                title: "Songs",
                description: "Upload your Songs",
              },
              {
                title: "Finish",
                description: "Confirm everything looks right",
              },
            ]}
            onStepChange={onChangePage}
          />
          {/* <SupportCard className="w-full backdrop-blur-lg lg:bg-white/40 lg:shadow-none dark:lg:bg-white/20" /> */}
        </div>
        <div className="flex h-full w-full flex-col items-center gap-4 md:p-4">
          {/* <div className="sticky top-0 z-10 w-full rounded-large bg-gradient-to-r from-default-100 via-danger-100 to-secondary-100 py-4 shadow-small md:max-w-xl lg:hidden"> */}
            {/* <div className="flex justify-center"> */}
              {/* Mobile Steps */}
              {/* <RowSteps
                className={"pl-6"}
                currentStep={currentPage}
                steps={[
                  {
                    title: "Account",
                  },
                  {
                    title: "Information",
                  },
                  {
                    title: "Address",
                  },
                  {
                    title: "Payment",
                  },
                ]}
                onStepChange={onChangePage}
              />
            </div>
          </div> */}
          <div className="h-full w-full p-4 sm:max-w-md md:max-w-lg">
            {children}
            <MultistepNavigationButtons
              backButtonProps={{isDisabled: currentPage === 0}}
              className="lg:hidden"
              nextButtonProps={{
                children:
                  currentPage === 0
                    ? "Next"
                    : currentPage === 3
                      ? "Next"
                      : "Continue",
              }}
              onBack={onBack}
              onNext={onNext}
            />
            {/* <SupportCard className="mx-auto w-full max-w-[252px] lg:hidden" /> */}
          </div>
        </div>
      </div>
    );
  },
);

MultiStepSidebar.displayName = "MultiStepSidebar";

export default MultiStepSidebar;
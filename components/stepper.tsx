import { UseStepper } from "headless-stepper";
import React from "react";

type Props = {
  currentStep: number;
  stepper: UseStepper;
  steps: Array<any>;
};
const Stepper = ({ currentStep, steps, stepper }: Props) => {
  // useStepper
  const { state, stepperProps, stepsProps, progressProps } = stepper;
  const barSize = React.useMemo(
    () => Math.ceil((state.currentStep / (steps?.length - 1)) * 100),
    [state, stepsProps]
  );

  return (
    <>
      <nav className="my-4 w-100 grid grid-cols-6 relative" {...stepperProps}>
        <ol className="col-span-full flex flex-row z-1">
          {stepsProps?.map((step, index) => (
            <li className="text-center flex-[1_0_auto]" key={index}>
              <a
                className="group flex flex-col items-center cursor-pointer focus:outline-0"
                {...step}
                onClick={() => {}}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 border border-full rounded-full  transition-colors ease-in-out ${
                    state?.currentStep === index
                      ? "bg-slate-500 text-white"
                      : state?.currentStep > index
                        ? "bg-slate-900 text-white"
                        : "text-black bg-white"
                  }`}
                >
                  {index + 1}
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div
          style={{ gridColumn: "2 / 8" }}
          className="flex items-center flex-row top-4 right-16 relative border-0.5 bg-gray-300 z-[-1] pointer-events-none row-span-full w-full h-0.5"
          {...progressProps}
        >
          <span className="h-full  flex" />
          <div
            style={{
              width: `${barSize}%`,
              gridColumn: 1 / -1,
              gridRow: 1 / -1,
            }}
            className="flex flex-row h-full overflow-hidden border-solid border-0 bg-slate-900"
          />
        </div>
      </nav>
    </>
  );
};

export default Stepper;

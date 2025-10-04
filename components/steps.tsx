import { CheckIcon } from "lucide-react";

const steps = [
  { name: "Create account", href: "#", status: "complete" },
  { name: "Profile information", href: "#", status: "current" },
  { name: "Theme", href: "#", status: "upcoming" },
  { name: "Preview", href: "#", status: "upcoming" },
];

type Option = {
  label: string;
};
type Props = {
  steps: Option[];
  currentStep: number;
  onClickStep: (step: number) => void;
};

export function Steps({ steps, currentStep, onClickStep }: Props) {
  return (
    <div className="">
      <nav className="flex justify-center" aria-label="Progress">
        <ol role="list" className="space-y-6">
          {steps.map((step, idx) => {
            const status =
              currentStep === idx
                ? "current"
                : currentStep > idx
                  ? "complete"
                  : "upcoming";
            return (
              <li
                key={step.label}
                onClick={() => onClickStep(idx)}
                className="cursor-pointer"
              >
                {status === "complete" ? (
                  <span className="group">
                    <span className="flex items-start">
                      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <CheckIcon
                          className="h-full w-full text-green-400 group-hover:text-green-600"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                        {step.label}
                      </span>
                    </span>
                  </span>
                ) : status === "current" ? (
                  <span className="flex items-start" aria-current="step">
                    <span
                      className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="absolute h-4 w-4 rounded-full bg-green-200" />
                      <span className="relative block h-2 w-2 rounded-full bg-green-400" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-green-400">
                      {step.label}
                    </span>
                  </span>
                ) : (
                  <span className="group">
                    <div className="flex items-start">
                      <div
                        className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                        aria-hidden="true"
                      >
                        <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                      </div>
                      <p className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                        {step.label}
                      </p>
                    </div>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

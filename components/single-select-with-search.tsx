import React from "react";
import { Icon } from "@iconify/react";
import {
  Avatar,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
} from "@heroui/react";

export type Option = {
  value: string;
  label: string;
  avatar?: string;
  subtitle?: string;
};

type Props = {
  options: Option[];
  defaultSelected?: Option | null;
  setSelected: (value: Option | null) => void;
  title?: string;
  placeholder?: string;
};

export function SingleSelect({
  options,
  defaultSelected,
  setSelected,
  title,
  placeholder = "Search by name or email...",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelectedInternal] = React.useState<Option | null>(
    defaultSelected ?? null
  );
  const [searchValue, setSearchValue] = React.useState("");

  React.useEffect(() => {
    setSelectedInternal(defaultSelected ?? null);
  }, [defaultSelected]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      }
    },
    []
  );

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      (option.subtitle &&
        option.subtitle.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelect = (option: Option) => {
    setSearchValue("");
    setSelectedInternal(option);
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div onKeyDown={handleKeyDown} className="w-full">
      <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom">
        <PopoverTrigger>
          <Button
            variant="bordered"
            className="justify-between w-full h-8 px-3 py-1 border-default-300 bg-content1"
          >
            <div className="flex items-center gap-2 w-[calc(100%-80px)]">
              {selected ? (
                <div className="flex items-center gap-2">
                  {selected.avatar && (
                    <Avatar 
                      src={selected.avatar} 
                      size="sm" 
                      className="w-6 h-6"
                    />
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selected.label}</span>
                  </div>
                </div>
              ) : (
                <span className="text-default-500">
                  {title || "Select an option..."}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Icon
                icon="lucide:chevron-down"
                className="text-default-500 h-4 w-4"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[360px] shadow-lg">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={searchValue}
              onValueChange={setSearchValue}
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
              size="sm"
              variant="bordered"
              classNames={{
                inputWrapper: "border-default-300 w-full",
                input: "w-full",
                base: "w-full",
              }}
              fullWidth
              autoFocus
            />
          </div>
          <Divider />
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-default-500">
                <Icon
                  icon="lucide:search-x"
                  className="mx-auto h-6 w-6 mb-2 opacity-50"
                />
                <p>No options found.</p>
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3 ${
                      selected?.value === option.value ? "bg-primary-50 border border-primary-200" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                  >
                    {option.avatar ? (
                      <Avatar src={option.avatar} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                        {option.label.charAt(0)}
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="font-medium">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-default-500">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {selected?.value === option.value && (
                      <Icon 
                        icon="lucide:check" 
                        className="h-4 w-4 text-primary-600" 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
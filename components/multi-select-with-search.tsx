import React from "react";
import { Icon } from "@iconify/react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  Tooltip,
} from "@heroui/react";

export type Option = {
  value: string;
  label: string;
  avatar?: string;
  subtitle?: string;
};

type Props = {
  options: Option[];
  defaultSelected?: Option[];
  setSelected: (value: Option[]) => void;
  title?: string;
  maxItems?: number;
};

export function MultiSelect({
  options,
  defaultSelected,
  setSelected,
  title,
  maxItems,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelectedInternal] = React.useState<Option[]>(
    defaultSelected ?? []
  );
  const [searchValue, setSearchValue] = React.useState("");

  React.useEffect(() => {
    setSelectedInternal(defaultSelected ?? []);
  }, [defaultSelected]);

  const handleUnselect = React.useCallback(
    (option: Option) => {
      setSelectedInternal((prev) => {
        const removed = prev.filter((s) => s.value !== option.value);
        setSelected(removed);
        return removed;
      });
    },
    [setSelected]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelectedInternal((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              setSelected(newSelected);
              return newSelected;
            });
          }
        }
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      }
    },
    [setSelected]
  );

  const selectableOptions = options.filter(
    (option) => 
      !selected.map((s) => s.value).includes(option.value) &&
      (maxItems === undefined || selected.length < maxItems)
  );

  const filteredOptions = selectableOptions.filter(
    (option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      (option.subtitle &&
        option.subtitle.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelect = (option: Option) => {
    if (maxItems !== undefined && selected.length >= maxItems) {
      return; // Don't add more items if max limit reached
    }
    
    setSearchValue("");
    setSelectedInternal((prev) => {
      const newSelected = [...prev, option];
      setSelected(newSelected);
      return newSelected;
    });
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInternal([]);
    setSelected([]);
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-start">
        <PopoverTrigger>
          <div
            role="button"
            tabIndex={0}
            className="flex justify-between items-center w-full h-auto flex-wrap min-h-12 px-4 py-2 border border-default-300 bg-content1 rounded-medium cursor-pointer hover:bg-default-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex flex-wrap gap-2 w-[calc(100%-80px)]">
              {selected.length > 0 ? (
                selected.map((option) => (
                  <div 
                    key={option.value} 
                    className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm"
                  >
                    {option.avatar && (
                      <Avatar 
                        src={option.avatar} 
                        size="sm" 
                        className="w-4 h-4"
                      />
                    )}
                    <span>{option.label}</span>
                    <div
                      className="cursor-pointer focus:outline-none rounded-full hover:bg-primary-200 p-0.5 transition-colors inline-flex items-center justify-center"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(option);
                      }}
                    >
                      <Icon icon="lucide:x" className="h-3 w-3" />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-default-500">
                  {title || "Select Options..."}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selected.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  className="min-w-0 h-auto py-1 px-2 text-xs font-medium text-danger cursor-pointer hover:bg-danger-50 rounded transition-colors"
                  onClick={handleClearAll}
                >
                  Clear
                </div>
              )}
              <Icon
                icon="lucide:chevron-down"
                className="text-default-500 h-4 w-4"
              />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px] shadow-lg">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder="Search by name or email..."
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
                <p>
                  {maxItems !== undefined && selected.length >= maxItems
                    ? `Maximum of ${maxItems} items selected.`
                    : "No items found."}
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3"
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
                    <div className="flex-grow min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-default-500 truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {maxItems !== undefined && selected.length > 0 && (
            <>
              <Divider />
              <div className="p-2 text-center text-xs text-default-500">
                {selected.length}/{maxItems} selected
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

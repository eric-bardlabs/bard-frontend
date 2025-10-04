import React from "react";
import { Input, Button, Select, SelectItem, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

interface EditableCellProps {
  initialValue: string;
  label?: string;
  onSave: (value: string) => void;
  renderValue?: () => React.ReactNode;
  type?: "text" | "date" | "url";
  options?: string[] | { label: string; value: string }[];
  validator?: (value: string) => boolean;
  validationMessage?: string;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  initialValue,
  label,
  onSave,
  renderValue,
  type = "text",
  options,
  validator,
  validationMessage = "Invalid input",
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  const [isValid, setIsValid] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (validator && !validator(value)) {
      setIsValid(false);
      return;
    }

    onSave(value);
    setIsEditing(false);
    setIsValid(true);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
    setIsValid(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleChange = (val: string) => {
    setValue(val);
    if (validator) {
      setIsValid(validator(val));
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        {options ? (
          <Select
            size="sm"
            selectedKeys={[value]}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
            className="w-full"
          >
            {options.map((option: any) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        ) : (
          <Input
            ref={inputRef}
            size="sm"
            type={type}
            value={value}
            onValueChange={handleChange}
            onKeyDown={handleKeyDown}
            isInvalid={!isValid}
            errorMessage={!isValid ? validationMessage : undefined}
            className=""
          />
        )}
        <div className="flex gap-1 mt-1">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            isIconOnly
            onPress={handleSave}
          >
            <Icon icon="lucide:check" className="text-xs" />
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            isIconOnly
            onPress={handleCancel}
          >
            <Icon icon="lucide:x" className="text-xs" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center group cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      {renderValue ? (
        renderValue()
      ) : (
        <span className="truncate max-w-[300px]" title={label || initialValue}>
          {label || initialValue || (
            <span className="text-default-400 italic">Empty</span>
          )}
        </span>
      )}
      <Tooltip content="Edit">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="opacity-0 group-hover:opacity-100 ml-2"
          onPress={() => setIsEditing(true)}
        >
          <Icon icon="lucide:edit-3" className="text-xs text-default-400" />
        </Button>
      </Tooltip>
    </div>
  );
};

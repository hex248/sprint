import { type ChangeEvent, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Field({
  label,
  value = "",
  onChange = () => {},
  validate,
  hidden = false,
  submitAttempted,
  placeholder,
  error,
  tabIndex,
  spellcheck,
  maxLength,
  showCounter = true,
  disabled = false,
  textarea = false,
}: {
  label: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  validate?: (value: string) => string | undefined;
  hidden?: boolean;
  submitAttempted?: boolean;
  placeholder?: string;
  error?: string;
  tabIndex?: number;
  spellcheck?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  disabled?: boolean;
  textarea?: boolean;
}) {
  const [internalTouched, setInternalTouched] = useState(false);
  const isTouched = submitAttempted || internalTouched;

  const invalidMessage = useMemo(() => {
    if (!isTouched && value === "") {
      return "";
    }
    return validate?.(value) ?? "";
  }, [isTouched, validate, value]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-end justify-between w-full">
        <Label htmlFor={label} className="flex items-center text-sm">
          {label}
        </Label>
      </div>
      {textarea ? (
        <Textarea
          id={label}
          placeholder={placeholder ?? label}
          value={value}
          onChange={(e) => {
            onChange(e);
            setInternalTouched(true);
          }}
          onBlur={() => setInternalTouched(true)}
          name={label}
          aria-invalid={error !== undefined || invalidMessage !== ""}
          tabIndex={tabIndex}
          spellCheck={spellcheck}
          maxLength={maxLength}
          disabled={disabled}
        />
      ) : (
        <Input
          id={label}
          placeholder={placeholder ?? label}
          value={value}
          onChange={(e) => {
            onChange(e);
            setInternalTouched(true);
          }}
          onBlur={() => setInternalTouched(true)}
          name={label}
          aria-invalid={error !== undefined || invalidMessage !== ""}
          type={hidden ? "password" : "text"}
          tabIndex={tabIndex}
          spellCheck={spellcheck}
          maxLength={maxLength}
          showCounter={showCounter}
          disabled={disabled}
        />
      )}
      <div className="flex items-end justify-end w-full text-xs mb-0 -mt-1">
        {error || invalidMessage !== "" ? (
          <Label className="text-destructive text-sm">{error ?? invalidMessage}</Label>
        ) : (
          <Label className="opacity-0 text-sm">a</Label>
        )}
      </div>
    </div>
  );
}

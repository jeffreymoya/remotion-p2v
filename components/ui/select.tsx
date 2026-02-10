"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/src/lib/storyflow/utils";

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
};

type ChildProps = { children?: React.ReactNode; placeholder?: string };

function collectOptions(children: React.ReactNode): React.ReactElement<SelectItemProps>[] {
  const result: React.ReactElement<SelectItemProps>[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      result.push(child as React.ReactElement<SelectItemProps>);
      return;
    }
    const props = child.props as ChildProps;
    if (props.children) {
      result.push(...collectOptions(props.children));
    }
  });

  return result;
}

function extractPlaceholder(children: React.ReactNode): string | undefined {
  let placeholder: string | undefined;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as ChildProps;
    if (child.type === SelectValue && props.placeholder) {
      placeholder = props.placeholder;
    }
    if (!placeholder && props.children) {
      placeholder = extractPlaceholder(props.children) ?? placeholder;
    }
  });
  return placeholder;
}

export function Select({ value, defaultValue, onValueChange, disabled, className, children }: SelectProps) {
  const options = useMemo(() => collectOptions(children), [children]);
  const placeholder = useMemo(() => extractPlaceholder(children), [children]);

  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value != null) return value;
    if (defaultValue != null) return defaultValue;
    return options[0]?.props.value ?? "";
  });

  const activeValue = value ?? internalValue;

  const handleChange = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <div className="relative">
      <select
        className={cn(
          "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        value={activeValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.props.value} value={opt.props.value}>
            {opt.props.children}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SelectTrigger({ children, className: _className }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>;
}
SelectItem.displayName = "SelectItem";

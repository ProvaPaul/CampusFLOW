import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes, useId } from "react";
import { cx } from "@/lib/utils";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
}

const baseFieldClasses =
  "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";

function FieldChrome({ label, error, hint, htmlFor, children }: FieldWrapperProps & { htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

type InputProps = FieldWrapperProps & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldChrome label={label} error={error} hint={hint} htmlFor={inputId}>
        <input ref={ref} id={inputId} className={cx(baseFieldClasses, error && "ring-red-400", className)} {...props} />
      </FieldChrome>
    );
  }
);
Input.displayName = "Input";

type TextareaProps = FieldWrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldChrome label={label} error={error} hint={hint} htmlFor={inputId}>
        <textarea ref={ref} id={inputId} rows={rows} className={cx(baseFieldClasses, error && "ring-red-400", className)} {...props} />
      </FieldChrome>
    );
  }
);
Textarea.displayName = "Textarea";

type SelectProps = FieldWrapperProps & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className, children, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldChrome label={label} error={error} hint={hint} htmlFor={inputId}>
        <select ref={ref} id={inputId} className={cx(baseFieldClasses, "bg-white dark:bg-slate-800", error && "ring-red-400", className)} {...props}>
          {children}
        </select>
      </FieldChrome>
    );
  }
);
Select.displayName = "Select";

// A field either shows a label or, when it has none, must name itself for assistive tech.
type LabelProps = { label: string } | { label?: null; 'aria-label': string };

// Props shared by every input component.
export type InputProps = LabelProps & {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
};

export type InputWithHelperProps = InputProps & { helperText?: string };

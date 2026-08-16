import { type FormEvent, useMemo, useState } from 'react';
import { type ZodType } from 'zod';

import { fieldErrors } from './validation';

type FormSchema<TValues> = ZodType | ((values: TValues) => ZodType);

export function useZodForm<TValues extends Record<string, string>>(
  schema: FormSchema<TValues>,
  initialValues: TValues,
) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof TValues, boolean>>>({});

  const parsed = useMemo(() => {
    const resolved = typeof schema === 'function' ? schema(values) : schema;
    return resolved.safeParse(values);
  }, [schema, values]);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);

  function setField(field: keyof TValues & string, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function touchField(field: keyof TValues & string) {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function fieldError(field: keyof TValues & string): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return {
    values,
    setField,
    touchField,
    fieldError,
    isValid: parsed.success,
    onSubmit,
  };
}

import { type FormEvent, useMemo, useState } from 'react';
import { type ZodType } from 'zod';

import { fieldErrors } from '@common/auth-validation';
import { clearFieldError } from '@common/utils/forms.util';

type FormSchema<TValues> = ZodType | ((values: TValues) => ZodType);

export function useZodForm<TValues extends Record<string, string>>(
  schema: FormSchema<TValues>,
  initialValues: TValues,
) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof TValues, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    const resolved = typeof schema === 'function' ? schema(values) : schema;
    return resolved.safeParse(values);
  }, [schema, values]);
  const errors = {
    ...(parsed.success ? {} : fieldErrors(parsed.error)),
    ...serverErrors,
  };

  function setField(field: keyof TValues & string, value: string) {
    setServerErrors((current) => clearFieldError(current, field));
    setValues((current) => ({ ...current, [field]: value }));
  }

  function touchField(field: keyof TValues & string) {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function fieldError(field: keyof TValues & string): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  function applyServerErrors(next: Record<string, string>) {
    setServerErrors(next);
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(Object.keys(next).map((key) => [key, true])),
    }));
  }

  function handleSubmit(onValid: (values: TValues) => void | Promise<void>) {
    return async (event: FormEvent) => {
      event.preventDefault();
      setTouched(
        Object.fromEntries(Object.keys(values).map((key) => [key, true])) as Record<
          keyof TValues,
          boolean
        >,
      );

      const resolved = typeof schema === 'function' ? schema(values) : schema;
      const result = resolved.safeParse(values);
      if (!result.success) {
        return;
      }

      setSubmitting(true);
      try {
        await onValid(result.data as TValues);
      } finally {
        setSubmitting(false);
      }
    };
  }

  return {
    values,
    setField,
    touchField,
    fieldError,
    applyServerErrors,
    handleSubmit,
    isValid: parsed.success,
    submitting,
  };
}

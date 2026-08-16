export function clearFieldError(
  current: Record<string, string>,
  field: string,
): Record<string, string> {
  if (!current[field]) {
    return current;
  }

  const next = { ...current };
  delete next[field];
  return next;
}

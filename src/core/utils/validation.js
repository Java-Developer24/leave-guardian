export function validateReason(reason) {
  if (!reason.trim()) return "Reason is required";
  if (reason.trim().length < 3) return "Reason must be at least 3 characters";
  if (reason.trim().length > 200) return "Reason must be under 200 characters";
  return null;
}

export function validateDateSelection(dates) {
  if (dates.length === 0) return "Select at least one date";
  return null;
}

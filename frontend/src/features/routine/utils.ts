export function generateTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 8);
}

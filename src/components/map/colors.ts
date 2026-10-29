import type { EnterpriseType } from "@/generated/prisma/enums";

// Leaflet paints SVG attributes directly, so these must be literal colours, not CSS variables.
export const ENTERPRISE_COLORS: Record<EnterpriseType, string> = {
  BEEF: "#b4532a",
  DAIRY: "#2563a8",
  SHEEP: "#8a6fb8",
  TILLAGE: "#c9962a",
  MIXED: "#2f7d4f",
  FORESTRY: "#1f5d3a",
  OTHER: "#6b7280",
};

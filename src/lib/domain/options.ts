import { County, EnterpriseType } from "@/generated/prisma/enums";
import { countyLabel, ENTERPRISE_LABELS } from "./labels";

export const WEST_COUNTIES: County[] = ["GALWAY", "MAYO", "ROSCOMMON", "SLIGO", "LEITRIM", "CLARE", "DONEGAL"];

export const COUNTY_OPTIONS = (Object.values(County) as County[]).map((c) => ({ value: c, label: countyLabel(c) }));

export const ENTERPRISE_OPTIONS = (Object.values(EnterpriseType) as EnterpriseType[]).map((e) => ({
  value: e,
  label: ENTERPRISE_LABELS[e],
}));

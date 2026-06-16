import type { ScamUrl, ScamUrlType } from "@/types/scam-url-api";

export type ScamUrlClientFilters = {
  urlType: ScamUrlType | "all";
  reason: string;
  addedBy: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_SCAM_URL_FILTERS: ScamUrlClientFilters = {
  urlType: "all",
  reason: "",
  addedBy: "",
  dateFrom: "",
  dateTo: "",
};

export function hasActiveClientFilters(filters: ScamUrlClientFilters): boolean {
  return (
    filters.urlType !== "all" ||
    filters.reason !== "" ||
    filters.addedBy !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== ""
  );
}

export function applyScamUrlClientFilters(
  items: ScamUrl[],
  filters: ScamUrlClientFilters,
): ScamUrl[] {
  return items.filter((item) => {
    if (filters.urlType !== "all" && item.url_type !== filters.urlType) return false;

    if (filters.reason && item.reason !== filters.reason) return false;

    if (
      filters.addedBy &&
      !item.reported_by_name.toLowerCase().includes(filters.addedBy.toLowerCase())
    ) {
      return false;
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(item.created_at) < from) return false;
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(item.created_at) > to) return false;
    }

    return true;
  });
}

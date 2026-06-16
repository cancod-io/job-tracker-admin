export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function getPaginationMeta(
  data: { page?: number; page_size?: number; total?: number } | null,
  page: number,
  pageSize: number,
) {
  const paginationPageSize = Math.max(1, data?.page_size ?? pageSize);
  const paginationTotal = Math.max(0, data?.total ?? 0);
  const currentPage = Math.max(1, data?.page ?? page);
  const totalPages = data ? Math.max(1, Math.ceil(paginationTotal / paginationPageSize)) : 1;
  return { paginationPageSize, paginationTotal, currentPage, totalPages };
}

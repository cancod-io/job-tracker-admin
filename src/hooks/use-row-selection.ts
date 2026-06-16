"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useRowSelection<T extends { id: number }>(
  pageItems: T[],
  resetDeps: unknown[],
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when list filters/page change
  }, resetDeps);

  const selectedOnPageCount = pageItems.filter((item) => selectedIds.has(item.id)).length;
  const allOnPageSelected =
    pageItems.length > 0 && selectedOnPageCount === pageItems.length;
  const someOnPageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < pageItems.length;

  const selectedItems = useMemo(
    () => pageItems.filter((item) => selectedIds.has(item.id)),
    [pageItems, selectedIds],
  );

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const item of pageItems) next.delete(item.id);
      } else {
        for (const item of pageItems) next.add(item.id);
      }
      return next;
    });
  }, [allOnPageSelected, pageItems]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    selectedOnPageCount,
    allOnPageSelected,
    someOnPageSelected,
    selectedItems,
    toggleSelect,
    toggleSelectAllOnPage,
    clearSelection,
  };
}

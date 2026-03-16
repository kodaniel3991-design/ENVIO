"use client";

import { useState, useMemo } from "react";

interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  /** Slice helper — pass full array, get current page slice */
  paginate: <T>(items: T[]) => T[];
  /** For display: "Showing X-Y of Z" */
  rangeStart: number;
  rangeEnd: number;
}

export function usePagination({
  totalItems,
  pageSize: initialPageSize = 10,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPageRaw] = useState(initialPage);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const setPage = (p: number) => setPageRaw(Math.min(Math.max(1, p), totalPages));
  const setPageSize = (s: number) => {
    setPageSizeRaw(s);
    setPageRaw(1);
  };

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  const paginate = useMemo(
    () =>
      <T>(items: T[]): T[] =>
        items.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize]
  );

  return { page, pageSize, totalPages, setPage, setPageSize, paginate, rangeStart, rangeEnd };
}

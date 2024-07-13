import React from 'react';
import { createSearchParams, useSearchParams } from 'react-router-dom';

export type QueryParamsType = {
  [key: string]: string;
};
export type SetQueryParamsType = (newParams: QueryParamsType) => void;

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(Array.from(searchParams));
}

export function sortObject(params: QueryParamsType) {
  return Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
}

export function cleanObject(params: QueryParamsType) {
  const cleaned = Object.entries(params).filter(([, value]) => value !== undefined);
  return Object.fromEntries(cleaned);
}

export function makeParams(newParams: QueryParamsType) {
  return createSearchParams(sortObject(cleanObject(newParams)));
}

export function makeSearch(newParams: QueryParamsType) {
  return makeParams(newParams).toString();
}

export function useParams(): [QueryParamsType, SetQueryParamsType] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = React.useMemo(() => sortObject(searchParamsToObject(searchParams)), [searchParams]);

  const updateParams = React.useCallback(
    (newParams: QueryParamsType) => {
      setSearchParams(makeParams(newParams));
    },
    [setSearchParams]
  );

  return [params, updateParams];
}

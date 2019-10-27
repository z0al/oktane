// Packages
import { createSelector } from 'reselect';

// Ours
import { RootState } from './actions';

const allQueries = (state: RootState) => state.queries;

export const savedQuery = createSelector(
  allQueries,
  (_: any, id: string | number) => id,
  (data, id) => data[id]
);

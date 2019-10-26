// Packages
import { createSelector } from 'reselect';

// Ours
import * as t from './internals/types';
import { RootState } from './reducers';

const queries = (state: RootState) => state.queries;

export const queryData = createSelector(
  queries,
  (_: any, id: t.ID) => id,
  (data, id) => data[id]
);

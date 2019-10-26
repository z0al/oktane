// Packages
import { combineReducers } from 'redux';

// Ours
import * as actions from './actions';
import * as is from './internals/is';
import * as t from './internals/types';

export interface QueryData {
  id: t.ID;
  type?: 'query';
  dataIds: t.ID[];
  loading?: boolean;
  next?: any;
  error?: any;
}

export interface Queries {
  [id: string]: QueryData;
}

export interface Objects {
  [id: string]: t.DataObject;
}

function queries(state: Queries = {}, act: actions.Action): Queries {
  switch (act.type) {
    // query/fetch
    //
    // * Set query type
    // * Set loading to true
    // * Make sure dataIds is an array
    //
    // TODO: the query type should always be the same between calls
    case actions.QUERY_FETCH: {
      const { query } = act.payload;
      const obj: QueryData = { ...state[query.id] } || {};

      obj.id = query.id;
      obj.loading = true;
      obj.type = query.type || 'query';

      // Make sure .dataIds is an array
      if (!is.array(obj.dataIds)) {
        obj.dataIds = [];
      }

      return { ...state, [query.id]: obj };
    }

    // query/error
    //
    // * Set error
    // * Set loading to false
    //
    case actions.QUERY_ERROR: {
      const { query, error } = act.payload;
      const obj: QueryData = { ...state[query.id] } || {};

      obj.error = error;
      obj.loading = false;

      return { ...state, [query.id]: obj };
    }

    // query/result
    //
    // * Merge dataIds
    // * Set loading to false
    //
    case actions.QUERY_RESULT: {
      const { query, data, next } = act.payload;
      const obj: QueryData = { ...state[query.id] } || {};

      obj.loading = false;
      obj.next = next;

      const ids = data.map(o => o.id);
      if (is.array(obj.dataIds)) {
        ids.push(...obj.dataIds);
      }

      obj.dataIds = Array.from(new Set(ids));

      return { ...state, [query.id]: obj };
    }
  }

  return state;
}

function objects(state: Objects = {}, _: actions.Action): Objects {
  return state;
}

const reducer = combineReducers({ queries, objects });
export type RootState = ReturnType<typeof reducer>;
export default reducer;

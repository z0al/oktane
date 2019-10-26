// Packages
import { combineReducers } from 'redux';

// Ours
import * as actions from './actions';
import * as is from './internals/is';
import * as t from './internals/types';

interface QueryObject {
  id: t.ID;
  type?: 'query';
  dataIds: t.ID[];
  loading?: boolean;
  error?: any;
}

interface Queries {
  [id: string]: QueryObject;
}

interface Objects {
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
      const obj: QueryObject = { ...state[query.id] } || {};

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
      const obj: QueryObject = { ...state[query.id] } || {};

      obj.error = error;
      obj.loading = false;

      return { ...state, [query.id]: obj };
    }

    // cache/add
    //
    // * Merge dataIds
    // * Set loading to false
    //
    case actions.CACHE_ADD: {
      const { query, data } = act.payload;
      const obj: QueryObject = { ...state[query.id] } || {};

      obj.loading = false;

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

export default combineReducers({ queries, objects });

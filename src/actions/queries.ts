// Packages
import is from 'is';

// Ours
import { Action } from '.';
import * as t from '../types';
import * as actions from './constants';

export interface QueryState extends t.Query {
  type: t.QueryType;
  ids: Array<string | number>;
  loading?: boolean;
  done?: boolean;
  next?: any;
  error?: any;
}

export interface State {
  [id: string]: QueryState;
}

function queries(state: State = {}, action: Action): State {
  const empty: any = {};

  switch (action.type) {
    // query/request
    //
    // Should:
    // * Set loading to true
    // * Set done to false
    // * Set other query metadata
    //
    case actions.QUERY_REQUEST: {
      const { query, options } = action.payload;
      const obj: QueryState = { ...state[query.__id] } || empty;

      obj.__id = query.__id;
      obj.type = options.type;
      obj.loading = true;
      obj.done = false;

      // Make sure .ids is an array
      if (!is.array(obj.ids)) {
        obj.ids = [];
      }

      return { ...state, [query.__id]: obj };
    }

    // query/error
    //
    // Should:
    // * Set error value
    // * Set loading to false
    // * Set done to true
    //
    case actions.QUERY_ERROR: {
      const { query, error } = action.payload;
      const obj: QueryState = { ...state[query.__id] } || empty;

      obj.error = error;
      obj.loading = false;
      obj.done = true;

      return { ...state, [query.__id]: obj };
    }

    // query/data
    // query/done
    //
    // Should:
    // * Set loading to false
    // * Set done to true (if query/done)
    // * Append ids
    //
    case actions.QUERY_DATA:
    case actions.QUERY_DONE: {
      const { query, data, next } = action.payload;
      const obj: QueryState = { ...state[query.__id] } || empty;

      obj.loading = false;
      obj.next = next;

      // Are we done?
      if (action.type === actions.QUERY_DONE) {
        obj.done = true;
      }

      const ids = data.map(d => d.id);
      if (is.array(obj.ids)) {
        ids.push(...obj.ids);
      }

      obj.ids = Array.from(new Set(ids));

      return { ...state, [query.__id]: obj };
    }
  }

  return state;
}

export default queries;

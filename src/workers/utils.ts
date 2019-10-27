// Packages
import { take } from 'redux-saga/effects';

// Ours
import * as t from '../types';
import * as actions from '../actions';

const pattern = [actions.QUERY_CANCEL];

export function* cancel(query: t.Query) {
  while (true) {
    const { payload }: actions.Action = yield take(pattern);

    if (payload.query.__id === query.__id) {
      return yield true;
    }
  }
}

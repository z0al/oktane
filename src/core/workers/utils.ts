// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as act from '../actions';
import * as t from '../internals/types';

export function* cancel(query: t.Query) {
  const actions = [act.QUERY_CANCEL];

  while (true) {
    const { payload }: act.Action = yield saga.take(actions);

    if (payload.query.id === query.id) {
      return yield true;
    }
  }
}

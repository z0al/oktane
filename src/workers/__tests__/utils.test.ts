// Packages
import * as saga from 'redux-saga/effects';

// Ours
import * as utils from '../utils';
import * as act from '../../actions';

describe('cancel', () => {
  const query = { id: 'CANCEL_THIS' };

  it('waits for cancel actions', () => {
    const gen = utils.cancel(query);
    const actions = [act.QUERY_CANCEL];

    const cancel = act.queryCancel(query);
    const nocancel = act.queryCancel({ id: 'ANYTHING' });

    // Should just wait
    expect(gen.next().value).toEqual(saga.take(actions));
    expect(gen.next(nocancel).value).toEqual(saga.take(actions));
    expect(gen.next(nocancel).value).toEqual(saga.take(actions));
    expect(gen.next(nocancel).value).toEqual(saga.take(actions));

    // Should resolve
    expect(gen.next(cancel).value).toEqual(true);
    expect(gen.next().done).toEqual(true);
  });
});

// Packages
import * as saga from 'redux-saga/effects';

// Ours
import worker from '../query';
import * as utils from '../utils';
import * as actions from '../../actions';

globalThis.__DEV__ = true;

describe('query', () => {
  const query = { id: 'MY_QUERY' };

  let resolver: any;
  beforeEach(() => {
    resolver = jest.fn();
  });

  it('tries to resolve the query', () => {
    expect(worker(query, resolver).next().value).toEqual(
      saga.race({
        result: saga.call(resolver, {}),
        cancelled: saga.call(utils.isCancelled, query),
      })
    );
  });

  it('fires an action on error', () => {
    const gen = worker(query, resolver);
    const result = { error: 'FAIL' };

    gen.next(); // calling resolver
    expect(gen.next({ result }).value).toEqual(
      saga.put(actions.queryError(query, 'FAIL'))
    );
  });

  it('catches unhandled errors', () => {
    const gen = worker(query, resolver);
    const error = new Error('FAIL');

    gen.next(); // calling resolver
    expect(gen.throw(error).value).toEqual(
      saga.put(actions.queryError(query, error))
    );
  });

  it('adds data to cache', () => {
    const gen = worker(query, resolver);
    const result = { data: { id: 1 } };

    gen.next(resolver); // calling resolver
    expect(gen.next({ result }).value).toEqual(
      saga.put(actions.cacheAdd(query, [{ id: 1 }]))
    );
  });
});

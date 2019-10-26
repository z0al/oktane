// Packages
import { call, put } from 'redux-saga/effects';

// Ours
import worker from '../query';
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
      call(resolver, {})
    );
  });

  it('fires an action on error', () => {
    const gen = worker(query, resolver);

    gen.next(); // calling resolver
    expect(gen.next({ error: 'FAIL' }).value).toEqual(
      put(actions.queryError(query, 'FAIL'))
    );
  });

  it('catches unhandled errors', () => {
    const gen = worker(query, resolver);
    const error = new Error('FAIL');

    gen.next(); // calling resolver
    expect(gen.throw(error).value).toEqual(
      put(actions.queryError(query, error))
    );
  });

  it('adds data to cache', () => {
    const gen = worker(query, resolver);

    gen.next(resolver); // calling resolver
    expect(gen.next({ data: { id: 1 } }).value).toEqual(
      put(actions.cacheAdd(query, [{ id: 1 }]))
    );
  });
});

// Packages
import * as saga from 'redux-saga/effects';

// Ours
import worker from '../query';
import * as utils from '../utils';
import * as actions from '../../actions';

globalThis.__DEV__ = true;

describe('query', () => {
  const query = { id: 'MY_QUERY' };
  const options = { next: 'NEXT_ID' };

  let resolver: any;
  beforeEach(() => {
    resolver = jest.fn();
  });

  it('passes resolver options', () => {
    const gen = worker(query, resolver);

    gen.next();
    expect(gen.next(options).value).toEqual(
      saga.race({
        result: saga.call(resolver, options),
        cancelled: saga.call(utils.cancel, query),
      })
    );
  });

  it('fires an action on error', () => {
    const gen = worker(query, resolver);
    const result = { error: 'FAIL' };

    gen.next();
    gen.next(options);
    expect(gen.next({ result } as any).value).toEqual(
      saga.put(actions.queryError(query, 'FAIL'))
    );
  });

  it('catches unhandled errors', () => {
    const gen = worker(query, resolver);
    const error = new Error('FAIL');

    gen.next();
    gen.next(options);
    expect(gen.throw(error).value).toEqual(
      saga.put(actions.queryError(query, error))
    );
  });

  it('saves result', () => {
    // Single object
    let gen = worker(query, resolver);
    let result: any = { data: { id: 1 }, next: 'NEXT' };

    gen.next();
    gen.next(options);
    expect(gen.next({ result } as any).value).toEqual(
      saga.put(actions.queryResult(query, [{ id: 1 }], 'NEXT'))
    );

    // Data as array
    gen = worker(query, resolver);
    result = { data: [{ id: 1 }], next: null };

    gen.next();
    gen.next(options);
    expect(gen.next({ result } as any).value).toEqual(
      saga.put(actions.queryResult(query, [{ id: 1 }], null))
    );
  });
});

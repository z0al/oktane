// Ours
import reducer from '..';
import * as actions from '../constants';

describe('root', () => {
  const act = { type: 'undefined' };
  it('sets initial state', () => {
    expect(reducer(undefined, act)).toEqual({ queries: {} });
  });
});

describe(actions.QUERY_REQUEST, () => {
  const query = { __id: 'run-me' };
  const request = actions.queryRequest(query, { type: 'query' });

  it('sets loading to true', () => {
    const state = reducer(undefined, request);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        loading: true,
      }),
    });
  });

  it('sets done to false', () => {
    const state = reducer(undefined, request);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        done: false,
      }),
    });
  });

  it('sets other query metadata', () => {
    const state = reducer(undefined, request);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        __id: query.__id,
        type: 'query',
        ids: [],
      }),
    });
  });
});

describe(actions.QUERY_ERROR, () => {
  const query = { __id: 'run-me' };
  const error = new Error('FAIL');
  const fail = actions.queryError(query, error);

  it('sets loading to false', () => {
    const state = reducer(undefined, fail);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        loading: false,
      }),
    });
  });

  it('sets done to true', () => {
    const state = reducer(undefined, fail);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        done: true,
      }),
    });
  });

  it('sets other query metadata', () => {
    const state = reducer(undefined, fail);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        error,
      }),
    });
  });
});

describe(actions.QUERY_DATA, () => {
  const query = { __id: 'run-me' };
  const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const add = actions.queryData(query, data, 'NEXT');

  it('sets metadata', () => {
    const state = reducer(undefined, add);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        loading: false,
        next: 'NEXT',
      }),
    });
  });

  it('appends to ids', () => {
    let state = reducer(undefined, add);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        ids: [1, 2, 3],
      }),
    });

    const preload = {
      queries: {
        [query.__id]: {
          ids: [1, 4],
        },
      },
    };

    state = reducer(preload as any, add);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        ids: [1, 2, 3, 4],
      }),
    });
  });
});

describe(actions.QUERY_DONE, () => {
  const query = { __id: 'run-me' };
  const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const done = actions.queryDone(query, data, 'NEXT');

  it('sets metadata', () => {
    const state = reducer(undefined, done);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        loading: false,
        done: true,
        next: 'NEXT',
      }),
    });
  });

  it('appends to ids', () => {
    let state = reducer(undefined, done);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        ids: [1, 2, 3],
      }),
    });

    const preload = {
      queries: {
        [query.__id]: {
          ids: [1, 4],
        },
      },
    };

    state = reducer(preload as any, done);
    expect(state.queries).toEqual({
      [query.__id]: expect.objectContaining({
        ids: [1, 2, 3, 4],
      }),
    });
  });
});

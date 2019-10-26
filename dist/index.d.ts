import * as saga_$0 from "redux-saga/effects";
import { Action } from "redux";
declare type ID = string | number;
interface Object {
    [id: string]: any;
}
interface Query extends Object {
    id: ID;
    type?: 'query';
}
interface DataObject extends Object {
    id: ID;
    __typename?: string;
}
interface QueryResult extends Object {
    data?: DataObject[] | DataObject;
    next?: any;
    error?: any;
}
interface RunnerOptions {
    next?: any;
}
declare type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
declare type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
declare type IsAny<T, True, False = never> = (True | False) extends (T extends never ? True : False) ? True : False;
declare type IsUnknown<T, True, False = never> = unknown extends T ? IsAny<T, False, True> : False;
declare type IsEmptyObj<T, True, False = never> = T extends any ? keyof T extends never ? IsUnknown<T, False, True> : False : never;
/**
 * returns True if TS version is above 3.5, False if below.
 * uses feature detection to detect TS version >= 3.5
 * * versions below 3.5 will return `{}` for unresolvable interference
 * * versions above will return `unknown`
 * */
declare type AtLeastTS35<True, False> = [True, False][IsUnknown<ReturnType<(<T>() => T)>, 0, 1>];
declare type IsUnknownOrNonInferrable<T, True, False> = AtLeastTS35<IsUnknown<T, True, False>, IsEmptyObj<T, True, False>>;
/**
 * An action with a string type and an associated payload. This is the
 * type of action returned by `createAction()` action creators.
 *
 * @template P The type of the action's payload.
 * @template T the type used for the action type.
 * @template M The type of the action's meta (optional)
 * @template E The type of the action's error (optional)
 */
declare type PayloadAction<P = void, T extends string = string, M = void, E = void> = WithOptional<M, E, WithPayload<P, Action<T>>>;
declare type PrepareAction<P> = ((...args: any[]) => {
    payload: P;
}) | ((...args: any[]) => {
    payload: P;
    meta: any;
}) | ((...args: any[]) => {
    payload: P;
    meta: any;
    error: any;
});
declare type ActionCreatorWithPreparedPayload<PA extends PrepareAction<any> | void, T extends string = string> = WithTypeProperty<T, PA extends PrepareAction<infer P> ? (...args: Parameters<PA>) => PayloadAction<P, T, MetaOrVoid<PA>, ErrorOrVoid<PA>> : void>;
declare type ActionCreatorWithOptionalPayload<P, T extends string = string> = WithTypeProperty<T, {
    (payload?: undefined): PayloadAction<undefined, T>;
    <PT extends Diff<P, undefined>>(payload?: PT): PayloadAction<PT, T>;
}>;
declare type ActionCreatorWithoutPayload<T extends string = string> = WithTypeProperty<T, () => PayloadAction<undefined, T>>;
declare type ActionCreatorWithPayload<P, T extends string = string> = WithTypeProperty<T, IsUnknownOrNonInferrable<P, <PT extends unknown>(payload: PT) => PayloadAction<PT, T>, <PT extends P>(payload: PT) => PayloadAction<PT, T>>>;
/**
 * An action creator that produces actions with a `payload` attribute.
 */
declare type PayloadActionCreator<P = void, T extends string = string, PA extends PrepareAction<P> | void = void> = IfPrepareActionMethodProvided<PA, ActionCreatorWithPreparedPayload<PA, T>, IfMaybeUndefined<P, ActionCreatorWithOptionalPayload<P, T>, IfVoid<P, ActionCreatorWithoutPayload<T>, ActionCreatorWithPayload<P, T>>>>;
/**
 * A utility function to create an action creator for the given action type
 * string. The action creator accepts a single argument, which will be included
 * in the action object as a field called payload. The action creator function
 * will also have its toString() overriden so that it returns the action type,
 * allowing it to be used in reducer logic that is looking for that action type.
 *
 * @param type The action type to use for created actions.
 * @param prepare (optional) a method that takes any number of arguments and returns { payload } or { payload, meta }.
 *                If this is given, the resulting action creator will pass it's arguments to this method to calculate payload & meta.
 */
declare function createAction<P = void, T extends string = string>(type: T): PayloadActionCreator<P, T>;
declare function createAction<PA extends PrepareAction<any>, T extends string = string>(type: T, prepareAction: PA): PayloadActionCreator<ReturnType<PA>['payload'], T, PA>;
declare type Diff<T, U> = T extends U ? never : T;
declare type WithPayload<P, T> = T & {
    payload: P;
};
declare type WithOptional<M, E, T> = T & ([M] extends [void] ? {} : {
    meta: M;
}) & ([E] extends [void] ? {} : {
    error: E;
});
declare type WithTypeProperty<T, MergeIn> = {
    type: T;
} & MergeIn;
declare type IfPrepareActionMethodProvided<PA extends PrepareAction<any> | void, True, False> = PA extends (...args: any[]) => any ? True : False;
declare type MetaOrVoid<PA extends PrepareAction<any>> = ReturnType<PA> extends {
    meta: infer M;
} ? M : void;
declare type ErrorOrVoid<PA extends PrepareAction<any>> = ReturnType<PA> extends {
    error: infer E;
} ? E : void;
declare type IfMaybeUndefined<P, True, False> = [undefined] extends [P] ? True : False;
declare type IfVoid<P, True, False> = [void] extends [P] ? True : False;
declare module t {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: ch;
        ';;
        exp;
    }
    interface DataObject extends Object {
        id: ID;
        __typename?: string;
    }
    interface QueryResult extends Object {
        data?: DataObject[] | DataObject;
        next?: any;
        error?: any;
    }
    interface RunnerOptions {
        next?: any;
    }
    type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
    type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
}
declare const QUERY_FETCH = "query/fetch";
declare const queryFetch: {
    type: "query/fetch";
} & ((query: t.Query) => import("redux").Action<"query/fetch"> & {
    payload: {
        query: t.Query;
    };
});
declare const QUERY_ERROR = "query/error";
declare const queryError: {
    type: "query/error";
} & ((query: t.Query, error: any) => import("redux").Action<"query/error"> & {
    payload: {
        query: t.Query;
        error: any;
    };
});
declare const QUERY_CANCEL = "query/cancel";
declare const queryCancel: {
    type: "query/cancel";
} & ((query: t.Query) => import("redux").Action<"query/cancel"> & {
    payload: {
        query: t.Query;
    };
});
declare const QUERY_RESULT = "query/result";
declare const queryResult: {
    type: "query/result";
} & ((query: t.Query, data: t.DataObject[], next: any) => import("redux").Action<"query/result"> & {
    payload: {
        query: t.Query;
        data: t.DataObject[];
        next: any;
    };
});
declare type Action = ReturnType<typeof queryFetch> | ReturnType<typeof queryError> | ReturnType<typeof queryCancel> | ReturnType<typeof queryResult>;
declare module act {
    const QUERY_FETCH = "query/fetch";
    const queryFetch: {
        type: "query/fetch";
    } & ((query: t.Query) => import("redux").Action<"query/fetch"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_ERROR = "query/error";
    const queryError: {
        type: "query/error";
    } & ((query: t.Query, error: any) => import("redux").Action<"query/error"> & {
        payload: {
            query: t.Query;
            error: any;
        };
    });
    const QUERY_CANCEL = "query/cancel";
    const queryCancel: {
        type: "query/cancel";
    } & ((query: t.Query) => import("redux").Action<"query/cancel"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_RESULT = "query/result";
    const queryResult: {
        type: "query/result";
    } & ((query: t.Query, data: t.DataObject[], next: any) => import("redux").Action<"query/result"> & {
        payload: {
            query: t.Query;
            data: t.DataObject[];
            next: any;
        };
    });
    type Action = ReturnType<typeof queryFetch> | ReturnType<typeof queryError> | ReturnType<typeof queryCancel> | ReturnType<typeof queryResult>;
}
declare module t_$0 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: xport;
        fu;
    }
    interface DataObject extends Object {
        id: ID;
        __typename?: string;
    }
    interface QueryResult extends Object {
        data?: DataObject[] | DataObject;
        next?: any;
        error?: any;
    }
    interface RunnerOptions {
        next?: any;
    }
    type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
    type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
}
declare module t_$1 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: t;
    }
     * as;
    t;
}
interface DataObject extends Object {
    id: ID;
    __typename?: string;
}
interface QueryResult extends Object {
    data?: DataObject[] | DataObject;
    next?: any;
    error?: any;
}
interface RunnerOptions {
    next?: any;
}
type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
type QueryResolver = (// query/fetch
q: Query) => QueryRunner | Promise<QueryRunner>;
interface QueryData {
    id: t_$1.ID;
    type?: 'query';
    dataIds: t_$1.ID[];
    loading?: boolean;
    next?: any;
    error?: any;
}
interface Queries {
    [id: string]: QueryData;
}
interface Objects {
    [id: string]: t_$1.DataObject;
}
declare const reducer: import("redux").Reducer<{
    queries: Queries;
    objects: Objects;
}, import("redux").AnyAction>;
declare module t_$2 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: const;
    }
    interface DataObject extends Object {
        id: ID;
        __typename?: string;
    }
    interface QueryResult extends Object {
        data?: DataObject[] | DataObject;
        next?: any;
        error?: any;
    }
    interface RunnerOptions {
        next?: any;
    }
    type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
    type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
}
declare module actions {
    const QUERY_FETCH = "query/fetch";
    const queryFetch: {
        type: "query/fetch";
    } & ((query: t.Query) => import("redux").Action<"query/fetch"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_ERROR = "query/error";
    const queryError: {
        type: "query/error";
    } & ((query: t.Query, error: any) => import("redux").Action<"query/error"> & {
        payload: {
            query: t.Query;
            error: any;
        };
    });
    const QUERY_CANCEL = "query/cancel";
    const queryCancel: {
        type: "query/cancel";
    } & ((query: t.Query) => import("redux").Action<"query/cancel"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_RESULT = "query/result";
    const queryResult: {
        type: "query/result";
    } & ((query: t.Query, data: t.DataObject[], next: any) => import("redux").Action<"query/result"> & {
        payload: {
            query: t.Query;
            data: t.DataObject[];
            next: any;
        };
    });
    type Action = ReturnType<typeof queryFetch> | ReturnType<typeof queryError> | ReturnType<typeof queryCancel> | ReturnType<typeof queryResult>;
}
declare module t_$3 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: t;
    }
     * as;
    i;
}
interface DataObject extends Object {
    id: ID;
    __typename?: string;
}
interface QueryResult extends Object {
    data?: DataObject[] | DataObject;
    next?: any;
    error?: any;
}
interface RunnerOptions {
    next?: any;
}
type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
declare function query(query: t_$3.Query, runner: t_$3.QueryRunner): Generator<saga_$0.SimpleEffect<"SELECT", saga_$0.SelectEffectDescriptor> | import("@redux-saga/types").CombinatorEffect<"RACE", saga_$0.SimpleEffect<"CALL", saga_$0.CallEffectDescriptor<t_$3.QueryResult | Promise<t_$3.QueryResult>>> | saga_$0.SimpleEffect<"CALL", saga_$0.CallEffectDescriptor<Generator<true | saga_$0.SimpleEffect<"TAKE", saga_$0.TakeEffectDescriptor>, any, actions.Action>>>> | saga_$0.SimpleEffect<"PUT", saga_$0.PutEffectDescriptor<import("redux").Action<"query/error"> & {
    payload: {
        query: t_$3.Query;
        error: any;
    };
}>> | saga_$0.SimpleEffect<"PUT", saga_$0.PutEffectDescriptor<import("redux").Action<"query/result"> & {
    payload: {
        query: t_$3.Query;
        data: t_$3.DataObject[];
        next: any;
    };
}>>, any, {
    next: any;
}>;
declare module act_$0 {
    const QUERY_FETCH = "query/fetch";
    const queryFetch: {
        type: "query/fetch";
    } & ((query: t.Query) => import("redux").Action<"query/fetch"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_ERROR = "query/error";
    const queryError: {
        type: "query/error";
    } & ((query: t.Query, error: any) => import("redux").Action<"query/error"> & {
        payload: {
            query: t.Query;
            error: any;
        };
    });
    const QUERY_CANCEL = "query/cancel";
    const queryCancel: {
        type: "query/cancel";
    } & ((query: t.Query) => import("redux").Action<"query/cancel"> & {
        payload: {
            query: t.Query;
        };
    });
    const QUERY_RESULT = "query/result";
    const queryResult: {
        type: "query/result";
    } & ((query: t.Query, data: t.DataObject[], next: any) => import("redux").Action<"query/result"> & {
        payload: {
            query: t.Query;
            data: t.DataObject[];
            next: any;
        };
    });
    type Action = ReturnType<typeof queryFetch> | ReturnType<typeof queryError> | ReturnType<typeof queryCancel> | ReturnType<typeof queryResult>;
}
declare module t_$4 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: t;
        from;
    }
    interface DataObject extends Object {
        id: ID;
        __typename?: string;
    }
    interface QueryResult extends Object {
        data?: DataObject[] | DataObject;
        next?: any;
        error?: any;
    }
    interface RunnerOptions {
        next?: any;
    }
    type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
    type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
}
declare module t_$5 {
    type ID = string | number;
    interface Object {
        [id: string]: any;
    }
    interface Query extends Object {
        id: ID;
        type?: esolver;
    }
    interface DataObject extends Object {
        id: ID;
        __typename?: string;
    }
    interface QueryResult extends Object {
        data?: DataObject[] | DataObject;
        next?: any;
        error?: any;
    }
    interface RunnerOptions {
        next?: any;
    }
    type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
    type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;
}
interface Options {
    resolver: t_$5.QueryResolver;
}
declare function createEngine({ resolver }: Options): {
    reducer: import("redux").Reducer<{
        queries: import("./reducers").Queries;
        objects: import("./reducers").Objects;
    }, import("redux").AnyAction>;
    engine: () => Generator<import("@redux-saga/types").SimpleEffect<"TAKE", import("redux-saga/effects").TakeEffectDescriptor> | import("@redux-saga/types").SimpleEffect<"ACTION_CHANNEL", import("redux-saga/effects").ActionChannelEffectDescriptor> | import("@redux-saga/types").SimpleEffect<"CALL", import("redux-saga/effects").CallEffectDescriptor<t_$5.QueryRunner | Promise<t_$5.QueryRunner>>> | import("@redux-saga/types").SimpleEffect<"FORK", import("redux-saga/effects").ForkEffectDescriptor<any>>, never, Action>;
};
export { Options, createEngine };

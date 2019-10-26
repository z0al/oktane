import * as t from './internals/types';
export declare const QUERY_FETCH = "query/fetch";
export declare const queryFetch: {
    type: "query/fetch";
} & ((query: t.Query) => import("redux").Action<"query/fetch"> & {
    payload: {
        query: t.Query;
    };
});
export declare const QUERY_ERROR = "query/error";
export declare const queryError: {
    type: "query/error";
} & ((query: t.Query, error: any) => import("redux").Action<"query/error"> & {
    payload: {
        query: t.Query;
        error: any;
    };
});
export declare const QUERY_CANCEL = "query/cancel";
export declare const queryCancel: {
    type: "query/cancel";
} & ((query: t.Query) => import("redux").Action<"query/cancel"> & {
    payload: {
        query: t.Query;
    };
});
export declare const QUERY_RESULT = "query/result";
export declare const queryResult: {
    type: "query/result";
} & ((query: t.Query, data: t.DataObject[], next: any) => import("redux").Action<"query/result"> & {
    payload: {
        query: t.Query;
        data: t.DataObject[];
        next: any;
    };
});
export declare type Action = ReturnType<typeof queryFetch> | ReturnType<typeof queryError> | ReturnType<typeof queryCancel> | ReturnType<typeof queryResult>;

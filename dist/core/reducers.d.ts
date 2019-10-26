import * as t from './internals/types';
export interface QueryData {
    id: t.ID;
    type?: 'query';
    dataIds: t.ID[];
    loading?: boolean;
    next?: any;
    error?: any;
}
export interface Queries {
    [id: string]: QueryData;
}
export interface Objects {
    [id: string]: t.DataObject;
}
declare const reducer: import("redux").Reducer<{
    queries: Queries;
    objects: Objects;
}, import("redux").AnyAction>;
export declare type RootState = ReturnType<typeof reducer>;
export default reducer;

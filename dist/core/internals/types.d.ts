export declare type ID = string | number;
export interface Object {
    [id: string]: any;
}
export interface Query extends Object {
    id: ID;
    type?: 'query';
}
export interface DataObject extends Object {
    id: ID;
    __typename?: string;
}
export interface QueryResult extends Object {
    data?: DataObject[] | DataObject;
    next?: any;
    error?: any;
}
export interface RunnerOptions {
    next?: any;
}
export declare type QueryRunner = (o?: RunnerOptions) => QueryResult | Promise<QueryResult>;
export declare type QueryResolver = (q: Query) => QueryRunner | Promise<QueryRunner>;

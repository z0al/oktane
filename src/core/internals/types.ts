export type ID = string | number;

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
  error?: any;
}

export type ResolverOptions = Object;
export type QueryResolver = (
  o?: ResolverOptions
) => QueryResult | Promise<QueryResult>;

export type QueryHandler = (
  q: Query
) => QueryHandler | Promise<QueryResolver>;

export interface Query {
  __id?: string;
}

export type QueryType = 'query';

export interface QueryOptions {
  type: QueryType;
  args?: any;
}

export interface DataObject {
  id: string | number;
  __typename?: string;
  [other: string]: any;
}

export interface QueryResult {
  data?: DataObject[] | DataObject;
  next?: any;
  error?: any;
}

export interface RunnerOptions {
  args?: any;
  next?: any;
}

export type QueryRunner = (
  options: RunnerOptions
) => QueryResult | Promise<QueryResult>;

export type QueryResolver = (
  query: Query
) => QueryRunner | Promise<QueryRunner>;

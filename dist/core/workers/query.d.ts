import * as saga from 'redux-saga/effects';
import * as actions from '../actions';
import * as t from '../internals/types';
declare function query(query: t.Query, runner: t.QueryRunner): Generator<saga.SimpleEffect<"SELECT", saga.SelectEffectDescriptor> | import("@redux-saga/types").CombinatorEffect<"RACE", saga.SimpleEffect<"CALL", saga.CallEffectDescriptor<t.QueryResult | Promise<t.QueryResult>>> | saga.SimpleEffect<"CALL", saga.CallEffectDescriptor<Generator<true | saga.SimpleEffect<"TAKE", saga.TakeEffectDescriptor>, any, actions.Action>>>> | saga.SimpleEffect<"PUT", saga.PutEffectDescriptor<import("redux").Action<"query/error"> & {
    payload: {
        query: t.Query;
        error: any;
    };
}>> | saga.SimpleEffect<"PUT", saga.PutEffectDescriptor<import("redux").Action<"query/result"> & {
    payload: {
        query: t.Query;
        data: t.DataObject[];
        next: any;
    };
}>>, any, {
    next: any;
}>;
export default query;

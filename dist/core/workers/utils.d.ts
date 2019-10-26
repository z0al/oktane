import * as saga from 'redux-saga/effects';
import * as act from '../actions';
import * as t from '../internals/types';
export declare function cancel(query: t.Query): Generator<true | saga.SimpleEffect<"TAKE", saga.TakeEffectDescriptor>, any, act.Action>;

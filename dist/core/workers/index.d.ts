import * as saga from 'redux-saga/effects';
import * as act from '../actions';
import * as t from '../internals/types';
declare function init(resolver: t.QueryResolver): () => Generator<saga.SimpleEffect<"ACTION_CHANNEL", saga.ActionChannelEffectDescriptor> | saga.SimpleEffect<"TAKE", saga.TakeEffectDescriptor> | saga.SimpleEffect<"CALL", saga.CallEffectDescriptor<t.QueryRunner | Promise<t.QueryRunner>>> | saga.SimpleEffect<"FORK", saga.ForkEffectDescriptor<any>>, never, act.Action>;
export default init;

import * as t from './internals/types';
export interface Options {
    resolver: t.QueryResolver;
}
export declare function createEngine({ resolver }: Options): {
    reducer: import("redux").Reducer<{
        queries: import("./reducers").Queries;
        objects: import("./reducers").Objects;
    }, import("redux").AnyAction>;
    engine: () => Generator<import("@redux-saga/types").SimpleEffect<"ACTION_CHANNEL", import("redux-saga/effects").ActionChannelEffectDescriptor> | import("@redux-saga/types").SimpleEffect<"TAKE", import("redux-saga/effects").TakeEffectDescriptor> | import("@redux-saga/types").SimpleEffect<"CALL", import("redux-saga/effects").CallEffectDescriptor<t.QueryRunner | Promise<t.QueryRunner>>> | import("@redux-saga/types").SimpleEffect<"FORK", import("redux-saga/effects").ForkEffectDescriptor<any>>, never, import("./actions").Action>;
};

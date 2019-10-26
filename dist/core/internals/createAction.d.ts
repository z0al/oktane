/**
 * Copied from https://github.com/reduxjs/redux-starter-kit
 */
import { Action } from 'redux';
export declare type IsAny<T, True, False = never> = (True | False) extends (T extends never ? True : False) ? True : False;
export declare type IsUnknown<T, True, False = never> = unknown extends T ? IsAny<T, False, True> : False;
export declare type IsEmptyObj<T, True, False = never> = T extends any ? keyof T extends never ? IsUnknown<T, False, True> : False : never;
/**
 * returns True if TS version is above 3.5, False if below.
 * uses feature detection to detect TS version >= 3.5
 * * versions below 3.5 will return `{}` for unresolvable interference
 * * versions above will return `unknown`
 * */
export declare type AtLeastTS35<True, False> = [True, False][IsUnknown<ReturnType<(<T>() => T)>, 0, 1>];
export declare type IsUnknownOrNonInferrable<T, True, False> = AtLeastTS35<IsUnknown<T, True, False>, IsEmptyObj<T, True, False>>;
/**
 * An action with a string type and an associated payload. This is the
 * type of action returned by `createAction()` action creators.
 *
 * @template P The type of the action's payload.
 * @template T the type used for the action type.
 * @template M The type of the action's meta (optional)
 * @template E The type of the action's error (optional)
 */
export declare type PayloadAction<P = void, T extends string = string, M = void, E = void> = WithOptional<M, E, WithPayload<P, Action<T>>>;
export declare type PrepareAction<P> = ((...args: any[]) => {
    payload: P;
}) | ((...args: any[]) => {
    payload: P;
    meta: any;
}) | ((...args: any[]) => {
    payload: P;
    meta: any;
    error: any;
});
export declare type ActionCreatorWithPreparedPayload<PA extends PrepareAction<any> | void, T extends string = string> = WithTypeProperty<T, PA extends PrepareAction<infer P> ? (...args: Parameters<PA>) => PayloadAction<P, T, MetaOrVoid<PA>, ErrorOrVoid<PA>> : void>;
export declare type ActionCreatorWithOptionalPayload<P, T extends string = string> = WithTypeProperty<T, {
    (payload?: undefined): PayloadAction<undefined, T>;
    <PT extends Diff<P, undefined>>(payload?: PT): PayloadAction<PT, T>;
}>;
export declare type ActionCreatorWithoutPayload<T extends string = string> = WithTypeProperty<T, () => PayloadAction<undefined, T>>;
export declare type ActionCreatorWithPayload<P, T extends string = string> = WithTypeProperty<T, IsUnknownOrNonInferrable<P, <PT extends unknown>(payload: PT) => PayloadAction<PT, T>, <PT extends P>(payload: PT) => PayloadAction<PT, T>>>;
/**
 * An action creator that produces actions with a `payload` attribute.
 */
export declare type PayloadActionCreator<P = void, T extends string = string, PA extends PrepareAction<P> | void = void> = IfPrepareActionMethodProvided<PA, ActionCreatorWithPreparedPayload<PA, T>, IfMaybeUndefined<P, ActionCreatorWithOptionalPayload<P, T>, IfVoid<P, ActionCreatorWithoutPayload<T>, ActionCreatorWithPayload<P, T>>>>;
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
export declare function createAction<P = void, T extends string = string>(type: T): PayloadActionCreator<P, T>;
export declare function createAction<PA extends PrepareAction<any>, T extends string = string>(type: T, prepareAction: PA): PayloadActionCreator<ReturnType<PA>['payload'], T, PA>;
/**
 * Returns the action type of the actions created by the passed
 * `createAction()`-generated action creator (arbitrary action creators
 * are not supported).
 *
 * @param action The action creator whose action type to get.
 * @returns The action type used by the action creator.
 */
export declare function getType<T extends string>(actionCreator: PayloadActionCreator<any, T>): T;
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
export {};

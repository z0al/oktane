declare type Defined = Object | Array<unknown> | string | number | boolean | null;
export declare function defined(o: any): o is Defined;
export declare function object(o: any): boolean;
export declare const array: (arg: any) => arg is any[];
export {};

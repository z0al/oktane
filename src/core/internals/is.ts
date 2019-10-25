// A workaround for "anything" but not "undefined"
type Defined =
  | Object
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

export function defined(o: any): o is Defined {
  return typeof o !== 'undefined';
}

export const array = Array.isArray;

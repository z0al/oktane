// Ours
import { EmitFunc } from './types';
import { Operation } from './operations';

export const on = (types: Operation['type'][], logic: EmitFunc) => (
	next: EmitFunc
) => (op: Operation) => {
	if (types.includes(op.type)) {
		logic(op);
	}

	return next(op);
};

export interface Request {
	'@oktane/request': true;
	id: string;
	query?: any;
}

const stabilize = (_: string, value: any) => {
	if (typeof value === 'object' && !Array.isArray(value)) {
		return Object.keys(value)
			.sort()
			.reduce((prev, next) => {
				return { ...prev, [next]: value[next] };
			}, {});
	}

	return value;
};

export const createRequest = (query: any): Request => ({
	'@oktane/request': true,
	id: JSON.stringify(query, stabilize),
	query,
});

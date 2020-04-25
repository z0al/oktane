export interface Request {
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

export const buildRequest = (query: any): Request => ({
	id: JSON.stringify(query, stabilize),
	query,
});

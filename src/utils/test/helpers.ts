export const expectObservable = async (
	observable: any,
	values: any[],
	error: any = 'SHOULD_NOT_THROW'
) => {
	const vals: any[] = [];

	const toPromise = (observable: any) =>
		new Promise((resolve, reject) => {
			observable.subscribe({
				next: (v: any) => vals.push(v),
				error: reject,
				complete: () => resolve(vals),
			});
		});

	try {
		await toPromise(observable);
	} catch (e) {
		expect(e).toEqual(error);
	}

	expect(vals).toEqual(values);
};

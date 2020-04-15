// Ours
import { subscribe, Source } from '../utils/streams';

export const observe = async (
	source: any,
	expectedValues: any[],
	expectedError: any = 'SHOULD_NOT_THROW'
) => {
	let isClosed: Function;

	// Emitted values
	const values: any[] = [];

	// convert a stream to Promise that resolves when the stream
	// completes.
	const toPromise = (source: Source) =>
		new Promise((resolve, reject) => {
			const stream = subscribe(source, {
				next: (v: any) => values.push(v),
				error: reject,
				complete: (v: any) => {
					if (v) {
						values.push(v);
					}
					resolve(values);
				},
			});

			isClosed = stream.isClosed;

			const pull = () =>
				stream.next().then(() => {
					if (!isClosed()) {
						pull();
					}
				});

			if (source.pull) {
				pull();
			}
		});

	try {
		// wait for all values
		await toPromise(source);
	} catch (e) {
		expect(e).toEqual(expectedError);
	} finally {
		expect(isClosed()).toEqual(true);
	}

	expect(values).toEqual(expectedValues);
};

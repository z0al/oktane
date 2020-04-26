import { createClient } from 'oktane';

const client = createClient({
	fetch: () => {
		return (subscriber) => {
			let counter = 0;

			const interval = setInterval(() => {
				subscriber.next(counter++);
			}, 1000);

			return () => clearInterval(interval);
		};
	},
});

export default client;

import { createClient } from 'oktane';

let counter = 0;

const client = createClient({
	fetch: () => {
		return (subscriber) => {
			const interval = setInterval(() => {
				subscriber.next(counter++);
			}, 1000);

			return () => clearInterval(interval);
		};
	},
});

export default client;

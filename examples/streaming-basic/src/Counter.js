import React from 'react';
import { useQuery } from 'oktane';

const Counter = () => {
	const { data, status, cancel, refetch } = useQuery('counter');

	if (status === 'pending') {
		return <h2>Connecting ...</h2>;
	}

	return (
		<>
			<h2>Counter: {data} </h2>

			<button disabled={status === 'buffering'} onClick={refetch}>
				Reconnect
			</button>

			<button disabled={status === 'cancelled'} onClick={cancel}>
				Disconnect
			</button>
		</>
	);
};

export default Counter;

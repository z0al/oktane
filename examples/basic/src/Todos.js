import React from 'react';
import { useQuery } from 'oktane';

const Todos = () => {
	const { data, status } = useQuery('todos');

	if (status === 'pending') {
		return <p>loading ...</p>;
	}

	return (
		<>
			<h2>Todo list</h2>
			<ul>
				{data.map((todo) => (
					<li key={todo.id}>{todo.title}</li>
				))}
			</ul>
		</>
	);
};

export default Todos;

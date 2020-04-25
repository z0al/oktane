import React from 'react';
import { useQuery } from 'oktane';

const Stories = () => {
	const { data = [], status, hasMore, fetchMore } = useQuery({
		tags: 'story',
	});

	return (
		<div className="stories">
			<h2>
				Hacker News ( Powered by{' '}
				<a href="https://hn.algolia.com/api">Algolia</a>)
			</h2>

			<ul>
				{data.map((item) => (
					<li key={item.id}>
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{item.title}
						</a>
					</li>
				))}
			</ul>

			<div className="more">
				<button disabled={!hasMore()} onClick={fetchMore}>
					{status === 'pending'
						? 'loading'
						: status === 'completed'
						? "that's it for now"
						: 'load more'}
				</button>
			</div>
		</div>
	);
};

export default Stories;

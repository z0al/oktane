import React from 'react';
import { useQuery } from 'oktane';

const REPO = 'facebook/react';

const Issues = () => {
	const { data = [], status, hasMore, fetchMore } = useQuery(REPO);
	console.log(data);
	return (
		<div className="issues">
			<h2>
				Open issues in <a href={`https://github.com/${REPO}`}>{REPO}</a>
			</h2>

			<ul>
				{data.map((issue) => (
					<li key={issue.id}>
						<a
							href={issue.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{`(#${issue.id})`}
						</a>
						{' ' + issue.title}
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

export default Issues;

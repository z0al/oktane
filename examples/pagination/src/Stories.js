import React from 'react';
import { useQuery } from 'oktane';

const Stories = () => {
	const [page, setPage] = React.useState(0);
	const { data, status, error } = useQuery({
		tags: 'story',
		page,
	});

	if (status === 'pending') {
		return (
			<div className="stories">
				<h2>Hacker News</h2>

				<ul className="items">loading ... </ul>
			</div>
		);
	}

	if (status === 'failed') {
		return (
			<details>
				<summary>An error occured</summary>

				{error.message}
			</details>
		);
	}

	return (
		<div className="stories">
			<h2>Hacker News</h2>

			<ul className="items">
				{data.items.map((item) => (
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

			<div className="navigation">
				<button
					disabled={page === 0}
					onClick={() => {
						setPage(page - 1);
					}}
				>
					{'< Prev'}
				</button>

				<span> {page + 1}</span>

				<button
					disabled={page === data.last_page}
					onClick={() => {
						setPage(page + 1);
					}}
				>
					{'Next >'}
				</button>
			</div>

			<footer>
				Powered by <a href="https://hn.algolia.com/api">Algolia</a>
			</footer>
		</div>
	);
};

export default Stories;

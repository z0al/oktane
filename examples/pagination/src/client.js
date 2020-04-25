import { createClient } from 'oktane';

const BASE_URL = '//hn.algolia.com/api/v1/search_by_date';

const client = createClient({
	fetch: async ({ query }) => {
		const { tags, page } = query;

		const data = await (
			await fetch(
				`${BASE_URL}?tags=${tags}&page=${page}&hitsPerPage=15`
			)
		).json();

		return {
			items: data.hits.map((hit) => ({
				id: hit.objectID,
				title: hit.title,
				url:
					hit.url ||
					`https://news.ycombinator.com/item?id=${hit.objectID}`,
			})),
			last_page: data.nbPages - 1,
		};
	},
});

export default client;

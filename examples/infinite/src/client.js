import { createClient } from 'oktane';

const BASE_URL = '//hn.algolia.com/api/v1/search_by_date';

const client = createClient({
	fetch: async function*(request, { cache }) {
		const { tags } = request.query;

		let page = 0;
		const MAX_PAGE = 50;

		while (page < MAX_PAGE) {
			const response = await (
				await fetch(
					`${BASE_URL}?tags=${tags}&page=${page++}&hitsPerPage=15`
				)
			).json();

			const stories = response.hits.map((hit) => ({
				id: hit.objectID,
				title: hit.title,
				url:
					hit.url ||
					`https://news.ycombinator.com/item?id=${hit.objectID}`,
			}));

			// We need to append new stories to those already in cache.
			// In future this can be handled automatically by Oktane.
			// See: https://github.com/z0al/oktane/issues/3
			const storiesInCache = (cache.get(request.id) || {}).data;

			yield (storiesInCache || []).concat(stories);
		}
	},
});

export default client;

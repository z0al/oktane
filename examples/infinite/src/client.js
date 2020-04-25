import { createClient } from 'oktane';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit();

const client = createClient({
	fetch: (request, { cache }) => {
		const [owner, repo] = request.query.split('/');

		const itr = octokit.paginate.iterator(octokit.issues.listForRepo, {
			owner,
			repo,
		});

		return (async function*() {
			for await (const page of itr) {
				// We need to append new issues to those already in cache.
				// In future this can be handled automatically by Oktane.
				// See: https://github.com/z0al/oktane/issues/3

				const { data } = cache.get(request.id) || {};

				yield (data || []).concat(page.data);
			}
		})();
	},
});

export default client;

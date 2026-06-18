import type { APIRoute } from 'astro';

export const prerender = false; // Run dynamically as a serverless function

export const GET: APIRoute = async () => {
	const token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;

	if (!token) {
		// Return a simulated state with status 200 so development works out-of-the-box
		return new Response(
			JSON.stringify({
				simulated: true,
				totalContributions: 0,
				contributions: [],
				commits: []
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	}

	try {
		// 1. Fetch Contributions Calendar from GraphQL API (365 days)
		const gqlQuery = {
			query: `
				query {
					user(login: "dotfn") {
						contributionsCollection {
							contributionCalendar {
								totalContributions
								weeks {
									contributionDays {
										contributionCount
										date
									}
								}
							}
						}
					}
				}
			`
		};

		const gqlPromise = fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
				'User-Agent': 'dotfn-portfolio'
			},
			body: JSON.stringify(gqlQuery)
		}).then(res => {
			if (!res.ok) throw new Error(`GraphQL API returned status ${res.status}`);
			return res.json();
		});

		// 2. Fetch Events from REST API (authenticated with the token for high rate limits)
		const restPromise = fetch('https://api.github.com/users/dotfn/events', {
			headers: {
				'Authorization': `Bearer ${token}`,
				'User-Agent': 'dotfn-portfolio'
			}
		}).then(res => {
			if (!res.ok) throw new Error(`REST API returned status ${res.status}`);
			return res.json();
		});

		const [gqlData, restEvents] = await Promise.all([gqlPromise, restPromise]);

		// Parse Contributions
		const calendar = gqlData?.data?.user?.contributionsCollection?.contributionCalendar;
		const totalContributions = calendar?.totalContributions || 0;
		const contributionsList: { date: string; count: number }[] = [];

		if (calendar?.weeks) {
			calendar.weeks.forEach((week: any) => {
				if (week.contributionDays) {
					week.contributionDays.forEach((day: any) => {
						contributionsList.push({
							date: day.date,
							count: day.contributionCount
						});
					});
				}
			});
		}

		// Parse Commits (latest 5 PushEvent commits)
		const commitsList: any[] = [];
		if (Array.isArray(restEvents)) {
			restEvents.forEach(event => {
				if (event.type === 'PushEvent') {
					if (event.payload.commits) {
						event.payload.commits.forEach((commit: any) => {
							if (commitsList.length < 5) {
								commitsList.push({
									repo: event.repo.name.replace('dotfn/', ''),
									message: commit.message,
									sha: commit.sha.substring(0, 7),
									url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
									date: event.created_at
								});
							}
						});
					}
				}
			});
		}

		return new Response(
			JSON.stringify({
				simulated: false,
				totalContributions,
				contributions: contributionsList,
				commits: commitsList
			}),
			{ 
				status: 200, 
				headers: { 
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=600' // Cache response for 10 minutes on CDNs
				} 
			}
		);
	} catch (error: any) {
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

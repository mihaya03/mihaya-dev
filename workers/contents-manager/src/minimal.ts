export default {
	async fetch(_req: Request): Promise<Response> {
		return new Response(
			JSON.stringify({ status: "ok", ts: new Date().toISOString() }),
			{ headers: { "Content-Type": "application/json" } },
		);
	},
};

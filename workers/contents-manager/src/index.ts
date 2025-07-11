interface RequestBody {
	url: string;
	method: string;
	headers: Record<string, string>;
	timestamp: string;
}

export default {
	async fetch(req, env): Promise<Response> {
		const url = new URL(req.url);
		
		// API routes
		if (url.pathname === '/api/health') {
			return new Response(JSON.stringify({
				status: 'healthy',
				timestamp: new Date().toISOString(),
				environment: env.ENVIRONMENT || 'unknown'
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		if (url.pathname === '/api/queue/send') {
			const body: RequestBody = {
				url: req.url,
				method: req.method,
				headers: Object.fromEntries(req.headers),
				timestamp: new Date().toISOString()
			};
			
			await env.MIHAYA_DEV_QUEUE.send(body);
			
			return new Response(JSON.stringify({
				message: 'Message sent to queue successfully',
				timestamp: new Date().toISOString()
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		// Default response
		return new Response(JSON.stringify({
			message: 'Contents Manager API',
			version: '1.0.0',
			endpoints: [
				'/api/health',
				'/api/queue/send'
			]
		}), {
			headers: { 'Content-Type': 'application/json' }
		});
	},
	
	async queue(batch): Promise<void> {
		console.log(`Processing batch of ${batch.messages.length} messages`);
		
		for (const message of batch.messages) {
			try {
				const body = message.body as unknown as RequestBody;
				console.log(`[Queue] Processing message ${message.id}:`, {
					method: body.method,
					url: body.url,
					timestamp: body.timestamp,
					messageId: message.id
				});
				
				// Simulate processing
				await new Promise(resolve => setTimeout(resolve, 100));
				
				console.log(`[Queue] Message ${message.id} processed successfully`);
			} catch (error) {
				console.error(`[Queue] Failed to process message ${message.id}:`, error);
			}
		}
		
		console.log(`[Queue] Batch processing completed`);
	},
} satisfies ExportedHandler<Env, Error>;

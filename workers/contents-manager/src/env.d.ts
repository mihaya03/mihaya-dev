export {};

declare global {
	interface Env {
		/**
		 * Cloudflare secret (production 環境で wrangler secret / dashboard に設定)
		 * cf-typegen が出力しない独自シークレットのみここで追加
		 */
		DATABASE_URL: string;
	}
}

import { defineConfig } from 'drizzle-kit'

// ローカル開発とリモート環境の分岐設定
export default process.env.LOCAL_DB_PATH
	? {
			schema: './src/db/schema.ts',
			out: './drizzle/migrations',
			dialect: 'sqlite',
			dbCredentials: {
				url: process.env.LOCAL_DB_PATH,
			},
		}
	: defineConfig({
			schema: './src/db/schema.ts',
			out: './drizzle/migrations',
			dialect: 'sqlite',
			driver: 'd1-http',
			dbCredentials: {
				accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
				databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
				token: process.env.CLOUDFLARE_D1_TOKEN!,
			},
		})

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout";
import { LoggedErrorBoundary, NextjsLoggerProvider } from "@/lib/logger";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Saifuu - 家計管理アプリ",
	description:
		"個人用家計管理アプリケーション - 支出・収入の記録と分析、サブスクリプション管理",

	// プライバシー重視のロボット設定
	robots: {
		index: false,
		follow: false,
		noarchive: true,
		nosnippet: true,
		noimageindex: true,
		nocache: true,
	},

	// アプリケーション基本設定
	applicationName: "Saifuu",
	keywords: [
		"家計管理",
		"支出管理",
		"収入管理",
		"サブスクリプション管理",
		"個人用",
	],
	authors: [{ name: "Saifuu" }],
	creator: "Saifuu",
	publisher: "Saifuu",

	// アイコン設定
	// Next.js 13+ App Routerでは、app/ディレクトリのfavicon.ico, icon.svg, apple-icon.pngが自動的に使用される
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/icon.svg", type: "image/svg+xml" },
			{ url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		shortcut: ["/favicon.ico"],
		apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
	},

	// Open Graph設定（プライバシー重視）
	openGraph: {
		type: "website",
		locale: "ja_JP",
		title: "Saifuu - 家計管理アプリ",
		description:
			"個人用家計管理アプリケーション - 支出・収入の記録と分析、サブスクリプション管理",
		siteName: "Saifuu",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Saifuu - 家計管理アプリ",
			},
		],
	},

	// Twitter Card設定
	twitter: {
		card: "summary_large_image",
		title: "Saifuu - 家計管理アプリ",
		description:
			"個人用家計管理アプリケーション - 支出・収入の記録と分析、サブスクリプション管理",
		images: ["/og-image.png"],
	},

	// その他のメタタグ
	other: {
		"msapplication-TileColor": "#2563eb",
		"format-detection": "telephone=no",
		referrer: "strict-origin-when-cross-origin",
	},
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	colorScheme: "light dark",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// 環境に応じたロガー設定
	const isProduction = process.env.NODE_ENV === "production";
	const loggerConfig = {
		level: isProduction ? ("warn" as const) : ("debug" as const),
		enableConsole: !isProduction,
		bufferSize: isProduction ? 100 : 10,
		flushInterval: isProduction ? 10000 : 1000,
	};

	return (
		<html lang="ja">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<NextjsLoggerProvider config={loggerConfig}>
					<LoggedErrorBoundary>
						<Header />
						{children}
					</LoggedErrorBoundary>
				</NextjsLoggerProvider>
			</body>
		</html>
	);
}

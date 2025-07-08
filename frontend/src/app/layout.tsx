import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout";

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

	// ビューポート設定
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
	},

	colorScheme: "light dark",

	// アイコン設定
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon.svg", type: "image/svg+xml" },
		],
		shortcut: ["/favicon.ico"],
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
		"color-scheme": "light dark",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Header />
				{children}
			</body>
		</html>
	);
}

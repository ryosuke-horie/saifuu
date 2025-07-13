import Link from "next/link";

// ナビゲーションアイテムの定義
const navigationItems = [
	{
		href: "/expenses",
		label: "支出管理",
		icon: "💸",
		colorClass: "bg-blue-500 hover:bg-blue-600",
	},
	{
		href: "/subscriptions",
		label: "サブスクリプション管理",
		icon: "📱",
		colorClass: "bg-green-500 hover:bg-green-600",
	},
] as const;

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
			<main className="flex flex-col gap-8 items-center w-full max-w-md">
				<h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Saifuu</h1>
				<nav
					className="flex flex-col gap-4 w-full"
					aria-label="メインナビゲーション"
				>
					{navigationItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`
								flex items-center justify-center gap-3
								px-6 py-4 sm:py-3
								text-white font-medium
								rounded-lg transition-all duration-200
								transform hover:scale-105 hover:shadow-lg
								focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
								${item.colorClass}
							`}
							aria-label={`${item.label}ページへ移動`}
						>
							<span className="text-xl" aria-hidden="true">
								{item.icon}
							</span>
							<span className="text-base sm:text-lg">{item.label}</span>
						</Link>
					))}
				</nav>
			</main>
		</div>
	);
}

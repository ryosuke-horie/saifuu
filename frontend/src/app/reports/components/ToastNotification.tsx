type ToastNotificationProps = {
	message: string;
	show: boolean;
};

/**
 * トースト通知コンポーネント
 * 一時的なフィードバックメッセージを表示
 */
export function ToastNotification({ message, show }: ToastNotificationProps) {
	if (!show) return null;

	return (
		<div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
			{message}
		</div>
	);
}

import { forwardRef } from "react";

// Cardコンテナコンポーネント
export const Card = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
		{...props}
	/>
));
Card.displayName = "Card";

// CardHeaderコンポーネント
export const CardHeader = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div ref={ref} className={`p-6 ${className}`} {...props} />
));
CardHeader.displayName = "CardHeader";

// CardTitleコンポーネント
export const CardTitle = forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
	<h3
		ref={ref}
		className={`text-lg font-semibold leading-none tracking-tight ${className}`}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

// CardDescriptionコンポーネント
export const CardDescription = forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
	<p
		ref={ref}
		className={`text-sm text-gray-600 mt-1.5 ${className}`}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

// CardContentコンポーネント
export const CardContent = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

// CardFooterコンポーネント
export const CardFooter = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		className={`flex items-center p-6 pt-0 ${className}`}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

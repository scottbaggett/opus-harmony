// import { createRootRoute, Outlet } from "@tanstack/react-router";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from "react";
import appCss from "@/styles/index.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Opus One: Theory Explorer",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,800;1,400&display=swap?url",
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools />

				<Scripts />
			</body>
		</html>
	);
}

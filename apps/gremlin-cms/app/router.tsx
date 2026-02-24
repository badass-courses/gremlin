import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { Route as RootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";

const routeTree = RootRoute.addChildren([IndexRoute]);

export function createRouter() {
	const queryClient = new QueryClient();

	return createTanStackRouter({
		routeTree,
		context: {
			queryClient,
		},
		defaultPreload: "intent",
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

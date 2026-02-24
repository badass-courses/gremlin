import { createRoute } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";

export const Route = createRoute({
	getParentRoute: () => RootRoute,
	path: "/",
	component: HomePage,
});

function HomePage() {
	return (
		<main style={{ fontFamily: "ui-sans-serif, system-ui", margin: "3rem auto", maxWidth: "60ch", padding: "0 1rem" }}>
			<h1>Gremlin CMS</h1>
			<p>TanStack Start reference site for gremlincms.com.</p>
			<p>
				This app exists to validate framework parity with <code>apps/wizardshit-ai</code> while sharing
				<code> @gremlincms/core</code> and <code>@gremlincms/db</code>.
			</p>
		</main>
	);
}

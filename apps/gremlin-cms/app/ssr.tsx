import { StartServer } from "@tanstack/react-start";
import { createRouter } from "./router";

export default function App() {
	const router = createRouter();
	return <StartServer router={router} />;
}

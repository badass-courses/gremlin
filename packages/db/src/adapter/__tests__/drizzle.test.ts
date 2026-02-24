/**
 * DrizzleContentResourceAdapter test suite
 *
 * Uses the parameterized test suite from @gremlincms/test-utils with
 * FakeContentResourceAdapter for fast unit tests.
 *
 * For integration tests with real Postgres, see drizzle.integration.test.ts
 */

import { runContentResourceAdapterTests } from "@gremlincms/test-utils/adapter-tests";
import {
	FakeContentResourceAdapter,
	FakeDatabase,
} from "../../__tests__/fixtures.js";

// Run the full adapter test suite with the fake implementation
runContentResourceAdapterTests({
	name: "FakeContentResourceAdapter",
	createAdapter: () => {
		const db = new FakeDatabase();
		const adapter = new FakeContentResourceAdapter(db);
		return { adapter };
	},
});

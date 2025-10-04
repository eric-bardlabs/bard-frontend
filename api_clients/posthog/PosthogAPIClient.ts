import { PostHog } from "posthog-node";

const client = new PostHog("phc_e91iclGR8h0v3a7ZRZrn8dITtvRaeCPIsZnZ20FDsZZ", {
  host: "https://us.posthog.com",
});

export { client };

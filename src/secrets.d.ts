// The secrets Matt types into Cloudflare (and into .dev.vars on a developer's computer).
// They are named here so the code checks the same way on Cloudflare's builder, which has no
// .dev.vars to read the names from. Only the names live here, never the values.
interface BuildSecrets {
  BUILD_API_USER: string;
  BUILD_API_PASSWORD: string;
  WP_USER_AGENT: string;
  SESSION_SECRET: string;
}
interface Env extends BuildSecrets {}
declare namespace Cloudflare {
  interface Env extends BuildSecrets {}
}

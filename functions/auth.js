// Cloudflare Pages Function — step 1 of the Decap CMS "GitHub" OAuth flow.
// Decap CMS opens a popup pointed at {base_url}/auth (base_url is set in
// public/admin/config.yml). We redirect that popup to GitHub's own login
// screen, then GitHub redirects back to /callback with a one-time code.
//
// Requires two Cloudflare Pages environment variables (Settings > Environment
// variables in the Cloudflare dashboard): GITHUB_CLIENT_ID and
// GITHUB_CLIENT_SECRET, from a GitHub OAuth App.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.GITHUB_CLIENT_ID) {
    return new Response(
      "Configuration manquante : la variable d'environnement GITHUB_CLIENT_ID n'est pas définie dans Cloudflare Pages.",
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo,user");
  authorizeUrl.searchParams.set("state", state);

  const headers = new Headers();
  headers.set("Location", authorizeUrl.toString());
  headers.append(
    "Set-Cookie",
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  return new Response(null, { status: 302, headers });
}

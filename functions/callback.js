// Cloudflare Pages Function — step 2 of the Decap CMS "GitHub" OAuth flow.
// GitHub redirects here with a one-time `code`. We exchange it for an access
// token server-side (using GITHUB_CLIENT_SECRET, which never reaches the
// browser) and hand that token back to the Decap CMS popup via postMessage,
// exactly the handshake Decap's github backend expects.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieHeader = request.headers.get("Cookie") || "";
  const stateCookieMatch = cookieHeader.match(/oauth_state=([^;]+)/);
  const cookieState = stateCookieMatch ? stateCookieMatch[1] : null;

  if (!code || !state || !cookieState || state !== cookieState) {
    return new Response("État OAuth invalide ou expiré. Réessaie de te connecter depuis /admin/.", {
      status: 400,
    });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    return new Response(
      `Erreur d'authentification GitHub : ${tokenData.error_description || tokenData.error || "inconnue"}`,
      { status: 400 }
    );
  }

  const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });

  const html = `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(message) {
          window.opener.postMessage(
            'authorization:github:success:${payload}',
            message.origin
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
    Connexion réussie, tu peux fermer cette fenêtre.
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const signInPage = `<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to Learn MCP</title>
  <style>
    body{font:16px system-ui,sans-serif;max-width:28rem;margin:4rem auto;padding:0 1rem;color:#202124}
    label{display:block;margin:1rem 0 .3rem} input{box-sizing:border-box;width:100%;padding:.7rem}
    button{margin:1rem .5rem 0 0;padding:.7rem 1rem} #error{color:#b00020}
  </style>
  <h1>Sign in to Learn MCP</h1>
  <p>Use an email and password to connect your personal company.</p>
  <form id="form">
    <label for="name">Name (for a new account)</label><input id="name" autocomplete="name">
    <label for="email">Email</label><input id="email" type="email" required autocomplete="email">
    <label for="password">Password</label><input id="password" type="password" required autocomplete="current-password">
    <button type="submit" data-mode="signin">Sign in</button>
    <button type="submit" data-mode="signup">Create account</button>
  </form>
  <p id="error" role="alert"></p>
  <script>
    const form = document.querySelector('#form');
    const error = document.querySelector('#error');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const mode = event.submitter?.dataset.mode;
      const endpoint = mode === 'signup' ? '/sign-up/email' : '/sign-in/email';
      const body = {
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value,
      };
      if (mode === 'signup') body.name = document.querySelector('#name').value;
      error.textContent = '';
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        error.textContent = result.message || 'Sign-in failed. Check the details and try again.';
        return;
      }
      window.location.assign('/oauth2/authorize?' + window.location.search.slice(1));
    });
  </script>
</html>`;

export const consentPage = `<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Approve MCP access</title>
  <style>
    body{font:16px system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#202124}
    button{margin:1rem .5rem 0 0;padding:.7rem 1rem} #error{color:#b00020}
  </style>
  <h1>Approve MCP access</h1>
  <p><strong id="client"></strong> is requesting access to your personal company.</p>
  <p>Redirect destination: <code id="redirect"></code></p>
  <h2>Requested permissions</h2><ul id="scopes"></ul>
  <button id="approve">Approve</button><button id="deny">Deny</button>
  <p id="error" role="alert"></p>
  <script>
    const query = new URLSearchParams(window.location.search);
    document.querySelector('#client').textContent = query.get('client_name') || query.get('client_id') || 'This MCP client';
    try { document.querySelector('#redirect').textContent = new URL(query.get('redirect_uri')).hostname; }
    catch { document.querySelector('#redirect').textContent = 'the registered client'; }
    const scopeList = document.querySelector('#scopes');
    for (const scope of (query.get('scope') || '').split(/\\s+/).filter(Boolean)) {
      const item = document.createElement('li'); item.textContent = scope; scopeList.append(item);
    }
    async function decide(accept) {
      const response = await fetch('/oauth2/consent', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept, oauth_query: window.location.search.slice(1) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.url !== 'string') {
        document.querySelector('#error').textContent = result.message || 'Could not process the consent decision.';
        return;
      }
      window.location.assign(result.url);
    }
    document.querySelector('#approve').addEventListener('click', () => decide(true));
    document.querySelector('#deny').addEventListener('click', () => decide(false));
  </script>
</html>`;

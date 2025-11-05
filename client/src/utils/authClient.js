/**
 * @file authClient.js
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides thin wrappers around authentication endpoints with response sanitization.
 */
const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  // Remove sensitive properties leaking from the current backend payload.
  const { hashed_password: _hashedPassword, salt: _salt, ...safeUser } = user;
  return safeUser;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload?.error || payload?.message || 'Request failed';
    throw new Error(error);
  }
  return payload;
}

export async function signIn(credentials) {
  const response = await fetch('/auth/signin', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  const payload = await parseResponse(response);
  // TODO (Backend Team): set HttpOnly + Secure cookie flags when deploying behind HTTPS.
  return {
    message: payload?.message || 'Signed in successfully',
    token: payload?.token,
    user: sanitizeUser(payload?.user),
  };
  // TODO (Backend Team): remove hashed_password and salt fields from signin response payload.
}

export async function signOut() {
  const response = await fetch('/auth/signout', {
    method: 'GET',
    credentials: 'include',
  });
  return parseResponse(response);
}

export async function registerUser(data) {
  const response = await fetch('/api/users/', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  const payload = await parseResponse(response);
  return sanitizeUser(payload);
  // TODO (Backend Team): ensure createUser controller returns sanitized user data only.
}

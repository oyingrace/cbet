/**
 * Client-side fetch helper that tags requests with the connected MiniPay
 * wallet address, so the server can resolve the player's identity.
 */
export async function walletFetch(address, url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (address) headers['x-wallet-address'] = address;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

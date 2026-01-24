// this is meant to be imported on the client to interact with the server api
// all client side functions will be defined here

const actions = [
  {
    name: 'checkSecret',
    path: '/api/secret',
    method: 'POST'
  },
  {
    name: 'getUsers',
    path: '/api/users',
    method: 'GET'
  },
  {
    name: 'createUser',
    path: '/api/users',
    method: 'POST'
  },
  {
    name: 'getTokens',
    path: '/api/blockchain/tokens',
    method: 'GET'
  },
  {
    name: 'getToken',
    path: '/api/blockchain/tokens/balance',
    method: 'GET',
  },
  {
    name: 'createTrustline',
    path: '/api/blockchain/tokens/trustline',
    method: 'POST'
  },
  {
    name: 'getAccountInfo',
    path: '/api/blockchain/account',
    method: 'GET'
  },
  {
    name: 'getAmm',
    path: '/api/blockchain/amm',
    method: 'GET'
  },
  {
    name: 'getAmmByAccount',
    path: '/api/blockchain/amm/account',
    method: 'GET'
  },
  {
    name: 'tradeAmm',
    path: '/api/blockchain/amm',
    method: 'POST'
  },
  {
    name: 'XamanSignIn',
    path: '/api/xaman/sign-in',
    method: 'POST',
    secretRequired: true
  },
  {
    name: 'XamanGetPayload',
    path: '/api/xaman/payload',
    method: 'GET',
    secretRequired: true
  },
  {
    name: 'backupUsers',
    path: '/api/users/backup',
    method: 'GET'
  },
  {
    name: 'restoreUsers',
    path: '/api/users/restore',
    method: 'POST'
  },
  {
    name: 'clearUsers',
    path: '/api/users/clear',
    method: 'POST'
  }
]

type Headers = {
  [key: string]: string;
}

const api: { [key: string]: any } = {}
actions.forEach(action => {
  api[action.name] = async (props: any) => {
    const headers: Headers = {
      'content-type': 'application/json'
    }    

    let url = action.path;
    let body = undefined;
    let queryString = '';
    if (action.method === 'GET' && props && Object.keys(props).length) {
      // Ensure values are converted to strings to satisfy encodeURIComponent's expected parameter types
      queryString = Object.entries(props).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(`${value}`)}`).join('&');
      url = `${url}?${queryString}`;
    } else if (action.method !== 'GET') {
      body = JSON.stringify(props);
    }

    try {
      const response = await fetch(url, {
        method: action.method,
        headers,
        ...(body ? { body } : {})
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'An error occurred with the request.');
      }

      return response.json();
    } catch (error: any) {
      // This catch block will handle fetch errors as well as errors thrown from non-ok responses
      console.error(`Error with the ${action.name} action:`, error.message);
      throw error; // Rethrow the error so that the calling code can handle it
    }
  }
})

// Custom methods for dynamic routes
api.updateUser = async ({ address, name }: { address: string; name: string }) => {
  const response = await fetch(`/api/users/${encodeURIComponent(address)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}

api.deleteUser = async ({ address }: { address: string }) => {
  const response = await fetch(`/api/users/${encodeURIComponent(address)}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete user')
  return response.json()
}

export default api
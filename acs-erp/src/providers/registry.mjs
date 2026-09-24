// Provider gateway.
//
// Configuration is LOCAL_MOCK only. The other entries are interface
// declarations for future platforms and nothing else: no SDK is installed, no
// token is requested, no credential is read and no network call is made. A
// request for a provider without an approved adapter returns
// BLOCKED_SOURCE_UNAVAILABLE, and automatic fallback to any other provider is
// deliberately absent — a blocked source stays blocked.

import { ERROR_CODE, PROVIDER_MODE } from '../domain/constants.mjs';

export function createProviderGateway(providerFixtures) {
  const providers = providerFixtures.map((provider) => Object.freeze({ ...provider }));

  function find(providerId) {
    return providers.find((provider) => provider.provider_id === providerId) || null;
  }

  return {
    mode: PROVIDER_MODE,

    list() {
      return providers.slice();
    },

    /**
     * @returns {{ok: true, provider_id: string, payload: object, external_calls: 0}
     *          |{ok: false, code: string, provider_id: string, external_calls: 0}}
     */
    request(providerId, { resource } = {}) {
      const provider = find(providerId);
      if (!provider || provider.adapter_approved !== true || provider.enabled !== true) {
        return {
          ok: false,
          code: ERROR_CODE.BLOCKED_SOURCE_UNAVAILABLE,
          provider_id: providerId,
          resource: resource || null,
          external_calls: 0,
          fallback_attempted: false,
        };
      }
      // The only approved adapter is the local mock, which answers from the
      // in-process fixture set and never opens a socket.
      return {
        ok: true,
        provider_id: provider.provider_id,
        resource: resource || null,
        payload: { source: PROVIDER_MODE },
        external_calls: 0,
      };
    },
  };
}

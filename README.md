# ForbocAI Account

Use the ForbocAI Account portal to create the credentials and subscription that
authorize a game to call the hosted ForbocAI NPC API.

- Account portal: <https://account.forboc.ai>
- SDK documentation: <https://docs.forboc.ai>

## Connect A Game

1. Create or sign in to a ForbocAI account.
2. Create an API key for the game or deployment that will use it.
3. Provide the key to the game runtime as `FORBOCAI_API_KEY`.
4. Install the TypeScript or Unreal Engine SDK and send game-owned NPC identity,
   persona, observation, and world context through that SDK.

The SDK selects the hosted ForbocAI API without URL configuration. Set
`FORBOCAI_API_URL` only when the game intentionally targets another deployment.

## Account Responsibilities

The portal owns:

- account authentication
- API-key creation, one-time key reveal, listing, and revocation
- subscription selection and billing management
- usage and quota presentation

The portal does not own NPC identity, game state, dialogue presentation, action
execution, memory data, or Soul data. Those remain at the game and SDK
boundaries defined by the ForbocAI integration contract.

## Credential Handling

Treat each API key as a secret. Keep it outside source control, reflected game
assets, browser bundles, logs, screenshots, and save files. Use a distinct key
per deployment boundary and revoke a key immediately when its custody becomes
uncertain.

## SDKs

- TypeScript SDK: <https://docs.forboc.ai/npm/welcome>
- Unreal Engine SDK: <https://docs.forboc.ai/ue/welcome>

## License

All rights reserved. See [LICENSE](./LICENSE).


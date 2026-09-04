# XRPL Token Issuance & AMM Training App

An interactive web application for learning token issuance and liquidity provisioning on the XRP Ledger. This project is the companion application to the [XRPL Commons Token Issuance and Liquidity](https://docs.xrpl-commons.org/token-issuance-and-liquidity) training workshop.

## Overview

This training application guides participants through the complete lifecycle of token deployment and liquidity management on the XRP Ledger:

1. **Creating Accounts** - Set up issuer and receiver wallets
2. **Issuing Tokens** - Create fungible tokens with trust lines and rippling
3. **Creating AMM Pools** - Build automated market maker pools for liquidity

Participants connect via [Xaman](https://xaman.app/) wallet and interact with the XRP Ledger testnet to gain hands-on experience with:

- Token creation and transfers
- Trust line establishment
- AMM pool creation and management
- Asset swapping through liquidity pools

## Documentation

Follow along with the full training documentation:

- [Token Issuance and Liquidity Overview](https://docs.xrpl-commons.org/token-issuance-and-liquidity)
- [Creating Accounts](https://docs.xrpl-commons.org/token-issuance-and-liquidity/creating-accounts)
- [Issuing Tokens](https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens)
- [Creating an AMM Pool](https://docs.xrpl-commons.org/token-issuance-and-liquidity/creating-an-amm-pool)

## Prerequisites

- [Node.js](https://nodejs.org/) 20.x or higher
- [Xaman Wallet](https://xaman.app/) installed on your mobile device
- [Xaman Developer Account](https://apps.xumm.dev/) for API credentials

## Installation

1. Clone the repository:

```bash
git clone https://github.com/xrpl-commons/xrpl-amm-workflow.git
cd xrpl-amm-workflow
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```bash
# Xaman API credentials (get from https://apps.xumm.dev/)
XAMAN_API_KEY=
XAMAN_SECRET_KEY=

# XRPL Commons account (create from https://xrpl.org/resources/dev-tools/xrp-faucets)
XRPL_COMMONS_ADDRESS=
XRPL_COMMONS_SECRET=

# Network configuration
WSS_EXPLORER=wss://s.altnet.rippletest.net:51233
NETWORK=TESTNET
```

> **Note**: For production use, set `NETWORK=MAINNET` and update `WSS_EXPLORER` to a mainnet WebSocket endpoint.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Logging

Server-side code logs through the Pino facade in `server/utils/logger.ts` (the fleet standard, shared with the other XRPL Commons apps):

```ts
import { createLogger } from '~/server/utils/logger'

const log = createLogger('store')
log.info('user created', { xrplAddress })
log.error('failed to persist users.json', { err }) // errors always go in `err`, never in the message
```

- **Development** (`npm run dev`): coloured, multi-line `pino-pretty` output.
- **Production** (`NODE_ENV=production`): one JSON line per event on stdout, at most 1900 bytes, with `dt`, `level`, `msg`, `service`, and `err` / `event` when relevant. This is what Better Stack and the fleet-wide alerts (`level = ERROR|FATAL`, `event = startup`) consume. The Nitro plugin `server/plugins/00.logging.ts` also routes any stray `console.*` (including Nitro's own request errors) through the facade, emits one `event=startup` line at boot (`commit` comes from `COMMIT_SHA`), and turns uncaught exceptions / unhandled rejections into a single `FATAL` line before exiting with code 1.
- `LOG_LEVEL` (optional, default `info`) selects the minimum level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

Level discipline matters because `ERROR` pages a human: use `WARN` for expected, handled failures (validation rejects, 4xx returned to a client, optional integration unavailable), `ERROR` only for failures the app could not handle (5xx, upstream call failed, invariant violated), and `INFO` for lifecycle and business events, not per-request chatter (that is `DEBUG`).

Run the logging contract tests with `npm test`.

## Analytics

Page views are tracked with [Fathom](https://usefathom.com) (privacy-friendly, cookie-free, no consent banner). `plugins/fathom.client.ts` injects `https://cdn.usefathom.com/script.js` in **production builds only**; development never loads it. The site id (`TXPDCLCO`) is public because it ships in the client script, so it is hard-coded in `nuxt.config.ts` under `runtimeConfig.public.fathomSiteId` rather than read from an env var.

## Tech Stack

- [Nuxt 3](https://nuxt.com/) - Vue.js framework
- [Nuxt UI](https://ui.nuxt.com/) - UI component library
- [xrpl.js](https://js.xrpl.org/) - XRP Ledger JavaScript library
- [Xaman SDK](https://docs.xaman.dev/) - Wallet integration
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Resources

- [XRP Ledger Documentation](https://xrpl.org/)
- [XRPL Commons](https://www.xrpl-commons.org/)
- [Xaman Developer Docs](https://docs.xaman.dev/)
- [XRP Testnet Faucet](https://xrpl.org/resources/dev-tools/xrp-faucets)

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with love by [XRPL Commons](https://www.xrpl-commons.org/)

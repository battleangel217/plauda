# Plauda

Plauda is a chat-first AI sales assistant for small stores. Each merchant gets a
shareable storefront, a standalone AI chat, and a separate checkout page.

- No AI voice or phone calls. Customers talk to the assistant in chat.
- The public storefront is `/store/[slug]`. The chat lives at `/chat/[slug]`.
- Checkout is separate at `/checkout/[orderId]`; it is never embedded in the
  storefront or the chat.
- Chat sessions, order cards, and payment-confirmation state survive refreshes.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app defaults to the hosted backend at
`https://plauda.fastapicloud.dev` when `BACKEND_API_URL` is not set.

```bash
npm run build
npm start
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing site |
| `/store/[slug]` | Public, chat-first storefront |
| `/chat/[slug]` | Standalone public chat |
| `/checkout/[orderId]` | Checkout from a saved order snapshot |
| `/checkout/result` | PayPal return/cancel landing page |
| `/login`, `/register` | Merchant auth |
| `/dashboard` | Merchant overview |
| `/inbox` | Conversations and handoff queue |
| `/orders`, `/orders/[id]` | Order list and detail/actions |
| `/catalogue` | Products, variants, and delivery zones |
| `/business-info` | About, policies, and FAQ used by the assistant |
| `/settings` | Store, recovery, PayPal, and team settings |

## Architecture

All backend calls go through Next.js BFF routes, so the browser never talks to
the FastAPI origin directly:

- `/api/auth/*` proxies merchant login, registration, and `/auth/me`.
- `/api/chat/[slug]/*` proxies public storefront/chat requests and SSE streams.
- `/api/merchant/[...path]` is the authenticated merchant proxy. It forwards
  bearer tokens, query strings, JSON bodies, `204 No Content`, and SSE.

Merchant JWTs and the current user are stored in browser `localStorage`. A
non-sensitive `plauda_auth=1` cookie guards the merchant pages in `proxy.ts`; the
backend remains the source of truth for every request.

Public chat visitors get a visitor token from
`POST /public/chat/:slug/conversations`. The token and conversation status are
kept in `localStorage` under `plauda-chat:<slug>`.

Order cards are saved under `plauda-order:<id>` so `/checkout/[orderId]` can
render without a public order endpoint. The backend returns buyers to
`/checkout/result?order_id=...`; PayPal cancellation uses
`/checkout/result?order_id=...&status=cancel`.

## Backend contract

The app is wired to the live Plauda FastAPI backend. The most important
endpoints are listed in `.env.example`. The backend currently exposes no public
product or order catalogue, which is why the public storefront is chat-first and
checkout uses locally persisted order snapshots.

PayPal payment links come from the backend order card (`approval_link`). The
frontend never sees card details.

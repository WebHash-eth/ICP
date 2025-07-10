# ICP Integration – Webhash Deployment & Domain Management

This document outlines the implementation of Internet Computer (ICP) integration within **Webhash**, a no-code website builder that allows users to visually create, deploy, and manage websites — without writing code or handling any infrastructure.

Webhash abstracts the complexities of canister lifecycle, asset upload, and domain mapping, enabling seamless decentralized publishing on ICP.

---

## 📦 Deployment Architecture

Each website deployment creates or updates an ICP **canister** using `@dfinity/agent`, installs the necessary Wasm module, and uploads static assets.

### API: Create Deployment

**Endpoint:**  
`POST /deployments`

**Request Body:**

```json
{
  "userId": 123,
  "folderPath": "/path/to/project/assets",
  "deploymentId": 456
}
```

**Behavior:**

- Reuses an existing canister if `deploymentId` exists; otherwise, creates a new one.
- Installs the Wasm module onto the canister.
- Uploads all static files from the provided `folderPath`.
- Tracks deployment status (`IN_PROGRESS`, `FAILED`, `COMPLETED`) internally.
- Returns the assigned `canisterId`.

**Response:**

```json
{
  "canisterId": "rrkah-fqaaa-aaaaa-aaaaq-cai"
}
```

---

### Internal Flow

1. **Create or Fetch Canister:**  
   Via `icService.createCanister()` or lookup by `deploymentId`.

2. **Install Wasm Module:**  
   Uses `icService.installCode()` for new or upgrade deployments.

3. **Upload Files:**  
   Static files are uploaded as chunks using `icService.addAssets()`.

4. **Mark Status:**  
   Deployment status is stored with audit logs and timestamps.

---

## 🔄 Canister Cycle Monitoring

A background cron job monitors cycle usage across all deployed canisters:

- Runs periodically to fetch canister balances (`getCanisterStatus()`).
- If the balance falls below the threshold:
  - A top-up request is sent via `topUpCanister()`.
  - Cycle states are logged before and after the operation.
- Master wallet depletion triggers internal notifications and halts auto top-ups until replenished.

---

## 🌐 Custom Domain Integration

Webhash allows users to connect their own domains using **A records**. Instead of using ICP's native TXT/CNAME-based registration (which often fails for apex domains), Webhash uses a **gateway architecture** for broader compatibility and automated HTTPS.

We developed the gateway because many DNS providers do not support CNAME records at the apex (or top-level) domain (e.g., example.com). This limitation makes it difficult to directly point root domains to ICP-hosted websites using standard CNAME setups. The gateway solves this by allowing users to use A records instead.

---

## 🧾 DNS Instructions

To link a custom domain:

1. Go to your domain registrar (e.g., Namecheap, Cloudflare, GoDaddy).
2. Add an **A record**:

   - **Type:** A
   - **Host/Name:** `@` or `www`
   - **Value:** `<Webhash Gateway IP>`
   - **TTL:** Default (or lowest allowed)

3. Once DNS resolves:
   - The gateway verifies propagation
   - An SSL certificate is provisioned automatically
   - Your domain begins serving content via HTTPS from the ICP canister

---

## 🧠 Additional Notes

- Domain traffic is securely proxied from the Webhash Gateway to the assigned canister.
- SSL is handled automatically via ACME (no manual cert management).
- This approach ensures compatibility with both apex and subdomains.

---

## 📍 Project Lifecycle States

| State         | Description                                  |
| ------------- | -------------------------------------------- |
| `Live`        | Site is deployed and running with cycles     |
| `LowBalance`  | Canister balance is low; top-up required     |
| `Deactivated` | Out of cycles; site is temporarily suspended |
| `Deleted`     | Manually removed by the user                 |

---

## 📬 Support

For issues or integration support, contact the Webhash engineering team.  
Visit [webhash.com](https://webhash.com) to learn more.

---

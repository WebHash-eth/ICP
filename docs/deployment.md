# Deployment API Documentation

This document outlines the API endpoints related to deployments.

## Create Deployment

- **Endpoint:**
  `POST /deployments`
- **Description:**
  Initiates the deployment process for a new or existing project. This involves creating or updating an Internet Computer (IC) canister, installing code, and uploading project assets.
- **Request Body:**
  ```json
  {
    "userId": 123,
    "folderPath": "/path/to/project/assets",
    "deploymentId": 456
  }
  ```
  - `userId` (number, required): The ID of the user initiating the deployment.
  - `folderPath` (string, required): The local file system path to the folder containing the assets to be deployed.
  - `deploymentId` (number, required): A unique identifier for this deployment instance. If a deployment with this ID already exists, it will be updated; otherwise, a new one will be created.
- **Successful Response:**
  ```json
  {
    "canisterId": "rrkah-fqaaa-aaaaa-aaaaq-cai"
  }
  ```
  - `canisterId` (string): The ID of the IC canister where the project is deployed.
- **Error Responses:**
  - `400 Bad Request`: If input validation fails or other client-side errors occur.
  - `500 Internal Server Error`: If an unexpected error occurs during the deployment process (e.g., IC interaction issues, insufficient funds).

### Under the Hood (`createDeployment` method):

The `createDeployment` service method orchestrates the deployment of your project to the Internet Computer. Here's the core business logic:

1.  **Initialize or Retrieve Canister**:

    - If a deployment with the given `deploymentId` already exists, its `canisterId` is reused, and its record is marked as `IN_PROGRESS` for the update.
    - Otherwise (for a new deployment), a new IC canister is created via `icService.createCanister()`. The new `canisterId` is recorded, and a new deployment entry is created and marked as `IN_PROGRESS`.

2.  **Install Application Code**:

    - The application's Wasm module is installed onto the prepared canister (`icService.installCode()`). This step will perform an upgrade if it's an existing canister, or a fresh install for a new one.

3.  **Upload Assets**:

    - After a short delay (to allow the canister to be ready), all static assets from the provided `folderPath` are uploaded to the canister (`icService.addAssets()`).

4.  **Mark Completion**:

    - Once assets are successfully uploaded, the deployment is marked as `COMPLETED`.

5.  **Handle Failures**:
    - If any step fails (e.g., canister creation, code installation, asset upload, or insufficient funds on the IC), the deployment is marked as `FAILED`, and relevant error details are logged. For critical issues like insufficient funds, a notification may also be sent.

---

## Automatic Canister Top-ups

To ensure continuous operation of deployed applications, a background cron job automatically monitors and tops up canister cycles.

- **Purpose**: Proactively replenishes cycles for deployed canisters to prevent them from running out of resources and becoming unresponsive.
- **Frequency**: The cron job runs periodically (e.g., daily).

### How it Works:

1.  **Scheduled Check**: The cron job initiates the `checkAndTopUpCanisters` process within the `DeploymentService` at regular intervals.
2.  **Identify Canisters for Check**: The service queries for `COMPLETED` deployments that haven't had their status checked recently (e.g., based on `canisterStatusCheckIntervalDays` from configuration and the `lastStatusCheckAt` timestamp on the deployment record).
3.  **Fetch Canister Status**: For each identified deployment, it communicates with the Internet Computer using `icService.getCanisterStatus()` to retrieve the current cycle balance of the associated canister.
4.  **Evaluate Cycle Balance**: The current cycle balance is compared against a pre-configured minimum threshold (`minCyclesThreshold`).
5.  **Initiate Top-up (if needed)**:
    - If a canister's cycle balance is below the `minCyclesThreshold`, the `TopUpService` is invoked to perform a top-up.
    - The `topUpCanister` method in `TopUpService` first records the top-up attempt (e.g., in the `ic_topups` database table with a `PENDING` status), including the `canisterId`, `deploymentId`, `amount` to be topped up, and `cyclesBefore`.
    - It then calls `icService.topUpCanister()` to transfer the configured `topUpAmount` of cycles to the target canister on the IC.
    - Upon successful transfer, the `ic_topups` record is updated to `COMPLETED`, and the `cyclesAfter` field is populated.
6.  **Update Deployment Record**: After a successful check (and potential top-up), the `IcDeployment` record in the database is updated with the `remainingCycles` (which is the `cyclesAfter` value if a top-up occurred, or the current balance if no top-up was needed) and the `lastStatusCheckAt` timestamp is set to the current time.

### Failure Handling:

- **Individual Canister Top-up Failure**: If topping up a specific canister fails (e.g., due to IC issues not related to overall funds), the error is typically logged, and the specific `IcTopUp` record might be marked as `FAILED`.
- **Insufficient Master Wallet Funds**: If the system's main wallet (used to fund all top-ups) runs out of cycles, the `isInsufficientFundsError` utility will detect this. In such cases:
  - An error notification (e.g., via Discord) is sent, indicating the low balance of the master wallet.
  - The top-up loop for the current cron cycle usually breaks to prevent further failed attempts until the master wallet is replenished.

---

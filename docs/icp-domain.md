# Domain Management Documentation

## Domain Attach/Remove API

### Add a Domain

- **Endpoint:**  
  `POST /deployments/:deploymentId/domains`
- **Body:**  
  `{ "name": "<domain-name>" }`
- **Description:**  
  Attaches a domain to a deployment.
  - `deploymentId`: ID of the deployment (URL param).
  - `name`: Domain name (string, required).
- **Returns:**
  A JSON object representing the attached domain:

  ```json
  {
    "id": 1,
    "name": "example.com",
    "deploymentId": 123,
    "registrationId": "abc123",
    "registrationStatus": "PendingOrder", // or 'PendingChallengeResponse', 'PendingAcmeApproval', 'Available', 'Failed'
    "registrationErrorMessage": null, // or error message if registration failed
    "createdAt": "2025-05-28T10:00:00.000Z"
  }
  ```

  - `id`: Unique domain identifier
  - `name`: Domain name
  - `deploymentId`: Related deployment's ID
  - `registrationId`: IC registration identifier
  - `registrationStatus`: Status of domain registration (`PendingOrder`, `PendingChallengeResponse`, `PendingAcmeApproval`, `Available`, `Failed`)
  - `registrationErrorMessage`: Error message if registration failed, otherwise null
  - `createdAt`: Timestamp when the domain was attached

### Under the Hood (`addDomain` method):

1.  **Update Canister's Domain List File**: This method updates an asset file i.e `/.well-known/ic-domains` within the canister. It ensures the new `domainName` is added to this file, which maintains a list of domains associated with the canister.
2.  **Register on IC**: This method registers the domain on the IC.
    - Makes a `POST` request to `https://icp0.io/registrations` with the `domainName`. This IC endpoint is responsible for verifying DNS records (such as `_acme-challenge` CNAME and `_canister-id` TXT) for the domain.
    - Returns a `registrationId` from the IC upon successful initiation.
    - Handles potential errors during this process, converting them to `BadRequestException` if appropriate.

---

### Remove a Domain

- **Endpoint:**  
  `DELETE /domains/:domainId`
- **Description:**  
  Removes (detaches) a domain by its ID.
  - `domainId`: ID of the domain (URL param).
- **Returns:**  
  No content (`204 No Content` on success)

#### Under the Hood (`removeDomain` method):

1.  **Remove Domain from Canister**: This method removes the domain from the canister's configuration, removing the `domainName`.
2.  **Delete from IC**: This method deletes the domain from the IC.
    - Makes a `DELETE` request to `https://icp0.io/registrations/:registrationId` to remove the domain registration from the Internet Computer.

---

### Get Domains for Deployment

- **Endpoint:**  
  `GET /deployments/:deploymentId/domains`
- **Returns:**
  Array of domain objects (see "Add a Domain" for structure)

---

### Get Domain Status

- **Endpoint:**  
  `GET /domains/:domainId/status`
- **Returns:**
  ```json
  {
    "status": "Available" // or 'PendingOrder', 'PendingChallengeResponse', 'PendingAcmeApproval', 'Failed'
  }
  ```
  - `status`: Current registration status of the domain

#### Under the Hood (`getRegistrationStatus` method):

1.  **Check and Update Status**: This method checks the registration status of the domain by making a `GET` request to `https://icp0.io/registrations/:registrationId` to fetch the current registration status from the Internet Computer.
    - Parses the response to determine the `currentStatus` and any `errorMessage` (if the IC status is 'Failed').
    - If the fetched `currentStatus` or `errorMessage` differs from what's stored in the local database for the domain, it updates the domain record in the database with the new status and message.
    - Returns an object containing the `name`, `status` (the `currentStatus` from IC), and `errorMessage`.

---

## DNS Configuration for Custom Domains

_Note: This section provides general guidance for DNS setup and is for user reference. It is not directly related to the API endpoints described above._

When setting up a custom domain for your deployment, you need to add specific DNS records as required by the Internet Computer. For reference, see the [official documentation](https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains#example).

### Example DNS Records

Typically, you will need to add the following records:

- **CNAME**:  
  Points your subdomain (e.g., `foo.bar.com`) to the gateway or service as instructed.
- **TXT**:  
  Used for domain verification, e.g.,  
  `_canister-id.foo.bar.com` with the value being your canister ID.
- **ACME Challenge (TXT)**:  
  For SSL certificate validation, e.g.,  
  `_acme-challenge.foo.bar.com`

**Note:**  
Some DNS providers may require only the subdomain part (e.g., `foo` instead of `foo.bar.com`).  
Consult your DNS provider’s documentation if you’re unsure.

For a step-by-step guide and troubleshooting, see:  
[Using custom domains on Internet Computer](https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains#example)

---

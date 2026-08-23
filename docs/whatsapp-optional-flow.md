# Optional WhatsApp Updates

The website is the complete Picture Book workflow. Creating a book, preparing its Google Drive upload folder, showing status, and uploading photos do not require a WhatsApp number or WhatsApp activity.

## Customer flow

The Picture Book page offers **Get updates on WhatsApp**. That explicit action saves the optional number and creates a pre-filled `wa.me` link. Opening the link is not treated as a received message; the customer must press **Send** in WhatsApp. The web page continues independently and always displays the Drive link and upload instructions when ready.

Customers can also initiate the conversation directly from WhatsApp by sending a message to the business number. When the sender's number matches a saved user with a Picture Book, the conversation is automatically initiated and a reply is sent.

Website status and WhatsApp status are stored separately. Inbound messages are accepted when the sender matches a saved number and a Picture Book. Every inbound event is stored for audit. Unmatched, malformed, and unsolicited events are stored as unmatched and receive no automatic reply.

## Minimum Meta setup

Required for inbound messages:

- A Meta developer account and WhatsApp-enabled app.
- A WhatsApp Business Account with a connected business phone number and phone number ID.
- A public HTTPS webhook URL, the verify token configured in `WHATSAPP_VERIFY_TOKEN`, and the `messages` webhook field subscribed for the WABA.
- A production access token with the permissions required by the connected WABA, stored only in server environment variables.

Required for free-form replies:

- The inbound message must open the customer-service window. Meta currently documents this as a 24-hour window after the user message.
- The business phone number must be able to send Cloud API text messages and the recipient must be a valid WhatsApp user.

Required for later outbound updates:

- Inside the open customer-service window, a free-form text response is sufficient.
- After the window expires, Meta requires an approved message template for a business-initiated outbound message. This application intentionally does not implement templates, so an expired-window update is blocked and requires a later user message.

Production-only considerations include business and phone-number setup, permanent system-user token management, webhook HTTPS availability, and any Meta review or verification required for the selected account, permissions, phone number, or use case. These are account-dependent and are not removed by making WhatsApp optional.

Optional: asking for a customer's number, saving it, and offering the deep link. None of these steps verifies the number or sends a message automatically.

SELECT providerEventId, senderNumber, body, matched, processingStatus, matchedPictureBookId, createdAt
FROM whatsapp_webhook_events
ORDER BY createdAt DESC
LIMIT 20;

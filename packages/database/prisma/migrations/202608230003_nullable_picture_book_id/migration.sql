-- Make pictureBookId nullable in whatsapp_messages
ALTER TABLE "whatsapp_messages" ALTER COLUMN "pictureBookId" DROP NOT NULL;

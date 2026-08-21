const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({ keyFile: 'test-creds.json', scopes: ['https://www.googleapis.com/auth/drive'] });
const drive = google.drive({ version: 'v3', auth });
drive.files.create({ requestBody: { name: 'Test', mimeType: 'application/vnd.google-apps.folder' } }).then(res => console.log('SUCCESS:', res.data.id)).catch(err => console.error('ERROR:', err.message));
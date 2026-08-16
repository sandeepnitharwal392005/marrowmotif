const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({ input: fs.createReadStream('C:\\Users\\user\\.gemini\\antigravity\\brain\\e38cf3de-319d-4feb-89b6-5c32efc85234\\.system_generated\\logs\\transcript_full.jsonl') });
rl.on('line', (line) => {
  try {
    const entry = JSON.parse(line);
    if (entry.type === 'USER_INPUT' && entry.content.includes('"log"')) {
      const startIdx = entry.content.indexOf('{');
      const jsonStr = entry.content.substring(startIdx);
      const har = JSON.parse(jsonStr);
      const entries = har.log.entries;
      for (const req of entries) {
         console.log('URL:', req.request.url);
         console.log('Response Status:', req.response.status);
         if (req.response.content && req.response.content.text) {
             console.log('Response Body:', req.response.content.text);
         }
      }
    }
  } catch (e) {}
});

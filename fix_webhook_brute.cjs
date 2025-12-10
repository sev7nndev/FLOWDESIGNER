
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'server.cjs');
let content = fs.readFileSync(filePath, 'utf8');

const webhookFix = `          plan: planId
        });
      }
      
      return res.sendStatus(200);
    }
    
    // Default Fallback
    res.sendStatus(200);

  } catch (error) {
    console.error('Webhook Error:', error);
    res.sendStatus(500);
  }
  return;
});
`;

// Find start anchor
const startAnchor = 'plan: planId';
const endAnchor = '// Health Check Endpoint';

const startIndex = content.indexOf(startAnchor);
const endIndex = content.indexOf(endAnchor);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found! Start:', startIndex, 'End:', endIndex);
    process.exit(1);
}

// Check what we are replacing to be sure it's broken
const brokenBlock = content.substring(startIndex, endIndex);
console.log('Replacing Block:\n', brokenBlock);

// Replace
const newContent = content.substring(0, startIndex) + webhookFix + '\n\n' + content.substring(endIndex);

fs.writeFileSync(filePath, newContent);
console.log('Successfully brute-forced Webhook Route.');

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /    <\/div>\n\n      <RulesModal isOpen=\{showRulesModal\}[\s\S]*?<\/AnimatePresence>/;

const match = content.match(regex);
if (match) {
  let matchedStr = match[0];
  let inner = matchedStr.replace('    </div>\n\n', '');
  let newStr = inner + '\n    </div>';
  content = content.replace(regex, newStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Moved modals via regex");
} else {
  console.log("Could not find regex match");
}

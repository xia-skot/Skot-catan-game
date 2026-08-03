const fs = require('fs');
const files = [
  'src/components/AdminDashboard.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/GameOverModal.tsx',
  'src/components/LoginScreen.tsx',
  'src/components/MapAlbumModal.tsx',
  'src/components/MapGeneratorModal.tsx',
  'src/components/RulesModal.tsx',
  'src/components/SaveMapConfirmModal.tsx',
  'src/components/SoundSettingsModal.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/className="(.*?)fixed inset-0(.*?)"/g, 'className="$1absolute inset-0$2"');
    fs.writeFileSync(file, content);
  }
});
console.log("Fixed absolute inset-0");

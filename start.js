import { createAppServer } from './server.js';

const port = Number(process.env.PORT || 3000);
createAppServer().listen(port, '0.0.0.0', () => {
  console.log(`Notice page listening on port ${port}`);
});

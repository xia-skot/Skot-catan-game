import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from './server.js';

test('root and saved deep links show the same clickable notice without redirecting', async () => {
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    for (const path of ['/', '/room/123456?from=shortcut']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'manual' });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.match(html, /目前该网址已暂停，请跳转至：/);
      assert.match(html, /href="https:\/\/skot-game\.onrender\.com\/"/);
    }
    const health = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal(await health.text(), 'ok');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

import { test, expect } from '@playwright/test';
import { buildAccountGameHistory, buildMonthlyLeaderboard } from '../server/leaderboard';
import { shanghaiMonth } from '../shared/leaderboard';

const accountId = '111111111111111111111111';
const accounts = [{ _id: accountId, username: 'zx', isGuest: false, createdAt: new Date('2025-01-01T00:00:00Z') },
  ...['snow', 'haha'].map(name => ({ _id: name, username: name, isGuest: false, createdAt: new Date('2025-01-01T00:00:00Z') }))];

test('two registered history awards and the monthly UI agree after a legacy restore', async ({ page }, info) => {
  const now = Date.now();
  const records = ['639283', '792081'].map((roomId, index) => ({ roomId, gameId: roomId, identityVersion: index ? 1 : 2,
    completedAt: new Date(now - index * 1000), mapType: 'archipelago', winnerId: 0, turnCount: 40,
    players: [index ? 'haha' : 'snow', 'zx'].map((name, id) => ({ id, name, isBot: false, isOriginalBot: false,
      score: id ? (index ? 5 : 9) : 14, userId: index ? null : id ? accountId : name,
      sessionId: index ? null : id ? accountId : name, isGuest: !!index })) }));
  const history = buildAccountGameHistory(records, accounts, accountId, now);
  const monthly = buildMonthlyLeaderboard(records, accounts, shanghaiMonth(new Date(now)), 20, now, accountId);
  await page.route('**/api/demo/session*', async route => {
    const original = await (await route.fetch()).json();
    await route.fulfill({ json: { ...original, user: { ...original.user, username: 'zx' } } });
  });
  await page.route('**/api/me', async route => {
    const original = await (await route.fetch()).json();
    await route.fulfill({ json: { user: { ...original.user, username: 'zx' } } });
  });
  await page.route('**/api/user/games', route => route.fulfill({ json: history }));
  await page.route('**/api/leaderboard?*', route => route.fulfill({ json: monthly }));
  await page.goto('/');
  await page.locator('.lobby-tab-bar').getByRole('button', { name: '我的', exact: true }).click();
  await page.getByText('历史战绩', { exact: true }).click();
  const tables = page.locator('[data-history-scroll] table');
  await expect(tables).toHaveCount(2);
  for (const table of await tables.all()) {
    const row = table.locator('tbody tr').filter({ hasText: 'zx' });
    await expect(row.locator('td').last()).toHaveText('1');
  }
  await page.screenshot({ path: info.outputPath('zx-history-two-games.png'), fullPage: true });
  await page.evaluate(() => window.history.back());
  await page.getByRole('heading', { name: '排行榜', exact: true }).click();
  const row = page.locator('[data-leaderboard] tbody tr').filter({ hasText: 'zx' });
  await expect(row.locator('td').nth(1)).toHaveText('2');
  await expect(row.locator('td').nth(2)).toHaveText('2');
  await page.getByText('我的本月积分：2', { exact: true }).click();
  await expect(page.locator('[data-leaderboard] details li')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('zx-monthly-two-points.png'), fullPage: true });
});

test('the real demo history and leaderboard endpoints use the same recorded awards', async ({ request }) => {
  const session = await (await request.get('/api/demo/session')).json();
  const headers = { Authorization: `Bearer ${session.token}` };
  const history = await (await request.get('/api/user/games', { headers })).json();
  const monthly = await (await request.get('/api/leaderboard', { headers })).json();
  const thisMonth = history.games.filter((game: any) => shanghaiMonth(new Date(game.completedAt)) === monthly.month);
  const points = thisMonth.reduce((sum: number, game: any) => sum + game.players.find((p: any) => String(p.id) === game.viewerPlayerId).rankAward.points, 0);
  const row = monthly.entries.find((entry: any) => entry.userId === session.user.id);
  expect([row.points, row.gameCount]).toEqual([points, thisMonth.length]);
});

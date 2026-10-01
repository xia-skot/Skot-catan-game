# Old Catan site notice

Deploy this folder as the root of the old Render Web Service. It is independent of
the live game, database, and Cloudflare Worker. Do not deploy it to the new
`skot-game.onrender.com` entry service or to game services 01/02/03.

Build command: `npm install && npm run build`

Start command: `npm start`

Health check path (optional): `/healthz`

The page intentionally does not redirect automatically; visitors can read the
notice and open the new entry URL themselves. Old deep links show the same page.

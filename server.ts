import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import dns from 'dns';

// CRITICAL: 强制 Node.js 在全局范围内优先使用 IPv4
// 这必须在所有网络操作之前调用
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'secret-catan-key-12345';

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权访问' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token 无效' });
  }
};

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }
  next();
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  const httpServer = createHttpServer(app);

  // MongoDB Connection setup
  const MONGODB_URI = process.env.MONGODB_URI;
  let dbClient: MongoClient | null = null;
  let usersCollection: any = null;
  let verificationCodesCollection: any = null;
  let gamesCollection: any = null;
  let mapsCollection: any = null;
  
  if (MONGODB_URI) {
    dbClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    try {
      await dbClient.connect();
      const db = dbClient.db("catan_db");
      usersCollection = db.collection('users');
      verificationCodesCollection = db.collection('verification_codes');
      gamesCollection = db.collection('games');
      mapsCollection = db.collection('maps');
      
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await verificationCodesCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 }); // 10 minutes expiry
      console.log("[Server] Pinged your deployment. You successfully connected to MongoDB!");

      // Seed Admin Account if environment variables are provided
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASSWORD;
        const existingAdmin = await usersCollection.findOne({ email: adminEmail });
        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash(adminPass, 10);
          await usersCollection.insertOne({
            email: adminEmail,
            password: hashedPassword,
            username: '超级管理员',
            isGuest: false,
            role: 'admin',
            createdAt: new Date()
          });
          console.log(`[Server] Admin account seeded for ${adminEmail}`);
        } else if (existingAdmin.role !== 'admin') {
          // Upgrade existing account to admin if emails match
          await usersCollection.updateOne({ email: adminEmail }, { $set: { role: 'admin' } });
          console.log(`[Server] User ${adminEmail} upgraded to admin role.`);
        }
      }
    } catch (error) {
       console.error("[Server] MongoDB connection error:", error);
    }
  } else {
    console.warn("[Server] MONGODB_URI environment variable is not set. Skipping MongoDB connection.");
  }

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling']
  });

  // Log socket errors - but handle 'Session ID unknown' as a warning instead of error log
  io.engine.on("connection_error", (err) => {
    if (err.code === 1 && err.message === 'Session ID unknown') {
      return;
    }
    console.log("Connection error context:", err.req ? "Request available" : "No request");
    console.log("Connection error message:", err.message);
    console.log("Connection error code:", err.code);
    console.log("Connection error context:", err.context);
  });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/db-status', (req, res) => {
    res.json({ connected: !!usersCollection });
  });

  // ========== EMAIL TRANSPORTER ==========
  let smtpHost = process.env.SMTP_HOST || 'smtp.163.com';
  // 修正常见的配置错误
  if (smtpHost.includes('hw.')) smtpHost = 'smtp.163.com';
  
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log('[Server] Initializing Email Transporter:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser ? `Set (${smtpUser})` : 'Not Set',
    isSSL: smtpPort === 465
  });

  // 定义一个变量存储异步创建的 Transporter
  let transporterPromise: Promise<any>;

  const initTransporter = async () => {
    if (!smtpUser || !smtpPass) {
       console.warn('[Server] Missing SMTP credentials! Skipping transporter init.');
       return null;
    }

    // 辅助函数：尝试连接到指定的主机（IP 或域名）
    const tryConnect = async (target: string) => {
      console.log(`[Server] [SMTP] Attempting connection via IPv4: ${target}...`);
      const t = nodemailer.createTransport({
        host: target,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          servername: smtpHost, // 关键：即便用 IP 连接，也告诉证书系统它是 163.com
          rejectUnauthorized: false
        },
        family: 4, // 强制 IPv4 协议
        connectionTimeout: 15000,
        greetingTimeout: 15000,
      });
      await t.verify();
      return t;
    };

    try {
      // 方案 A: 强制 DNS 为 IPv4 查找并连接
      const resolvedAddress = await new Promise<string>((resolve, reject) => {
        dns.lookup(smtpHost, { family: 4 }, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`[Server] [DNS SUCCESS] ${smtpHost} -> ${resolvedAddress}`);
      const transporter = await tryConnect(resolvedAddress);
      console.log('[Server] SMTP Connection SUCCESS via Dynamic IPv4');
      return transporter;
    } catch (err: any) {
      console.warn(`[Server] SMTP Connection FAILED (Dynamic IPv4): ${err.message}. Trying Static Fallback...`);
      try {
        // 方案 B: 强制指定一个已知的 163 邮箱 IPv4 地址 (123.125.50.133)，完全跳过 DNS 解析
        // 这解决了任何环境下的 IPv6 ENETUNREACH 问题
        const known163IPv4 = '123.125.50.133';
        const transporter = await tryConnect(known163IPv4);
        console.log('[Server] SMTP Connection SUCCESS via Static IPv4 Fallback');
        return transporter;
      } catch (innerErr: any) {
        console.error('[Server] SMTP ALL METHODS FAILED. Render network route to 163.com might be blocked.');
        console.error('[Server] Final Error:', innerErr.message);
        return null;
      }
    }
  };

  transporterPromise = initTransporter();

  // ========== AUTH ROUTES ==========
  
  // Send Verification Code
  app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '请提供邮箱' });
    if (!verificationCodesCollection) return res.status(500).json({ error: '数据库未连接' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: '邮箱格式不正确' });

    console.log(`[Server] Attempting to send code to: ${email}`);

    try {
      const transporter = await transporterPromise;
      
      // Check if user already exists
      if (usersCollection) {
        const existing = await usersCollection.findOne({ email });
        if (existing) return res.status(400).json({ error: '该邮箱已被注册' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await verificationCodesCollection.updateOne(
        { email },
        { $set: { code, createdAt: new Date() } },
        { upsert: true }
      );

      if (!smtpUser || !smtpPass || !transporter) {
        console.log('[Server] No SMTP configured or failed to init, using fallback 123456');
        return res.json({ message: '测试环境：后台发信系统初始化失败，请暂时使用 123456' });
      }

      const info = await transporter.sendMail({
        // For 163.com, "from" address must exactly match the SMTP_USER
        from: smtpUser, 
        to: email,
        subject: 'CATAN - 账号注册验证码',
        text: `您的注册验证码是：${code}。\n验证码在 10 分钟内有效。如果不是您本人的操作，请忽略此邮件。`,
      });

      console.log(`[Server] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
      res.json({ message: '验证码已发送至您的邮箱' });
    } catch (error: any) {
      console.error('[Server] Email sending failed!');
      console.error('[Server] Error Name:', error.name);
      console.error('[Server] Error Message:', error.message);
      if (error.code) console.error('[Server] Error Code:', error.code);
      if (error.command) console.error('[Server] SMTP Command:', error.command);
      if (error.response) console.error('[Server] SMTP Response:', error.response);
      
      res.status(500).json({ error: '无法发送邮件，请检查后端日志中的 SMTP 错误详情' });
    }
  });

  // Register Account
  app.post('/api/register', async (req, res) => {
    if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
    const { email, password, username, code } = req.body;
    if (!email || !password || !username || !code) {
      return res.status(400).json({ error: '请填写所有必需的字段。' });
    }

    if (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: '不允许注册该专属管理员邮箱。' });
    }
    
    try {
      const record = await verificationCodesCollection.findOne({ email });
      if (!record || record.code !== code) {
        return res.status(400).json({ error: '验证码错误或已失效。' });
      }

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: '该邮箱已被注册。' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        email,
        password: hashedPassword,
        username,
        isGuest: false,
        createdAt: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      
      // Delete the consumed code
      await verificationCodesCollection.deleteOne({ email });

      const token = jwt.sign({ userId: result.insertedId, username, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: result.insertedId, username, email, isGuest: false } });
    } catch (err) {
      console.error('Register error', err);
      res.status(500).json({ error: '注册时发生错误' });
    }
  });

  // Reset Password (Forgot Password)
  app.post('/api/reset-password', async (req, res) => {
    if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: '请提供邮箱、验证码和新密码' });
    }
    try {
      const record = await verificationCodesCollection.findOne({ email });
      if (!record || record.code !== code) {
        return res.status(400).json({ error: '验证码错误或已失效' });
      }
      
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: '该邮箱尚未注册' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await usersCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
      await verificationCodesCollection.deleteOne({ email });
      
      res.json({ message: '密码重置成功，请使用新密码登录' });
    } catch (err) {
      console.error('Reset password error', err);
      res.status(500).json({ error: '重置密码失败' });
    }
  });

  // Login Account
  app.post('/api/login', async (req, res) => {
    if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码。' });
    }
    try {
      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(400).json({ error: '邮箱或密码错误。' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: '邮箱或密码错误。' });
      
      const token = jwt.sign({ userId: user._id, username: user.username, role: user.role, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, isGuest: false } });
    } catch (err) {
      console.error('Login error', err);
      res.status(500).json({ error: '登录时发生错误' });
    }
  });

  // Guest Login
  app.post('/api/guest', async (req, res) => {
    const { username } = req.body;
    const finalUsername = username || `游客-${Math.floor(Math.random()*10000)}`;
    const guestId = new ObjectId();
    const token = jwt.sign({ userId: guestId, username: finalUsername, role: 'guest', isGuest: true }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: guestId, username: finalUsername, role: 'guest', isGuest: true } });
  });

  // Verify Token
  app.get('/api/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供Token' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.isGuest) {
        return res.json({ user: { id: decoded.userId, username: decoded.username, role: 'guest', isGuest: true } });
      } else {
        if (!usersCollection) return res.json({ user: { id: decoded.userId, username: decoded.username, role: decoded.role, isGuest: false } });
        const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
        if (!user) return res.status(404).json({ error: '找不到用户' });
        res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role, isGuest: false } });
      }
    } catch (err) {
      res.status(401).json({ error: 'Token无效' });
    }
  });

  // ========== ADMIN ROUTES ==========
  app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userCount = usersCollection ? await usersCollection.countDocuments({ isGuest: false }) : 0;
      const guestCount = usersCollection ? await usersCollection.countDocuments({ isGuest: true }) : 0;
      const gameCount = gamesCollection ? await gamesCollection.countDocuments() : 0;
      
      const latestUsers = usersCollection ? await usersCollection.find({ isGuest: false }).sort({ createdAt: -1 }).limit(10).project({ password: 0 }).toArray() : [];
      const latestGames = gamesCollection ? await gamesCollection.find().sort({ completedAt: -1 }).limit(10).toArray() : [];

      res.json({
        stats: { users: userCount, guests: guestCount, games: gameCount },
        latestUsers,
        latestGames
      });
    } catch (error) {
      console.error('Admin API error', error);
      res.status(500).json({ error: '获取数据失败' });
    }
  });

  app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
      
      const { userId } = req.params;
      const userToDelete = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (!userToDelete) return res.status(404).json({ error: '找不到该用户' });
      
      if (userToDelete.role === 'admin') {
         return res.status(403).json({ error: '不能删除其他管理员账号' });
      }

      await usersCollection.deleteOne({ _id: new ObjectId(userId) });
      res.json({ message: '用户已成功注销' });
    } catch (error) {
      console.error('Admin delete user error', error);
      res.status(500).json({ error: '删除用户失败' });
    }
  });

  app.put('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
      const { userId } = req.params;
      const { username } = req.body;
      
      if (!username || username.trim() === '') {
        return res.status(400).json({ error: '昵称不能为空' });
      }

      const userToUpdate = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!userToUpdate) return res.status(404).json({ error: '找不到该用户' });

      await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { username: username.trim() } });
      res.json({ message: '昵称修改成功' });
    } catch (error) {
      console.error('Admin update user error', error);
      res.status(500).json({ error: '修改昵称失败' });
    }
  });

  app.put('/api/user/profile', authMiddleware, async (req, res) => {
    try {
      if (!usersCollection) return res.status(500).json({ error: '数据库未连接' });
      const userId = req.user.userId;
      
      if (req.user.isGuest) {
        return res.status(400).json({ error: '游客无法修改资料' });
      }

      const { username, password, oldPassword } = req.body;
      const updateData: any = {};
      
      if (username && username.trim() !== '') {
        updateData.username = username.trim();
      }
      
      if (password && password.trim() !== '') {
        if (!oldPassword || oldPassword.trim() === '') {
          return res.status(400).json({ error: '修改密码必须提供当前密码' });
        }
        const userToUpdate = await usersCollection.findOne({ _id: new ObjectId(userId) });
        const isMatch = await bcrypt.compare(oldPassword, userToUpdate.password);
        if (!isMatch) {
          return res.status(400).json({ error: '当前密码不正确' });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: '未提供修改内容' });
      }

      await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
      
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      const newToken = jwt.sign({ userId: user._id, username: user.username, role: user.role, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token: newToken, user: { id: user._id, username: user.username, email: user.email, role: user.role, isGuest: false } });
    } catch (error) {
      console.error('Update profile error', error);
      res.status(500).json({ error: '修改资料失败' });
    }
  });

  app.get('/api/proxy-image', async (req, res) => {
    try {
      let imageUrl = req.query.url as string;
      if (!imageUrl) {
        res.status(400).send('Missing url parameter');
        return;
      }

      // Use URL constructor which handles encoding correctly for fetch
      const targetUrl = new URL(imageUrl).toString();
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`, targetUrl);
        res.status(response.status).send('Failed to fetch image');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Proxy image error:', error);
      res.status(500).send('Internal server error');
    }
  });

  app.get('/api/user/games', authMiddleware, async (req, res) => {
    try {
      if (!gamesCollection) return res.status(500).json({ error: '数据库未连接' });
      const username = req.user.username;
      
      const games = await gamesCollection.find({ "players.name": username })
        .sort({ completedAt: -1 })
        .limit(20)
        .toArray();
        
      res.json({ games });
    } catch (err) {
      console.error('Fetch user games error', err);
      res.status(500).json({ error: '获取战绩失败' });
    }
  });

  // ========== MAPS ARCHIVE ROUTES ==========
  app.get('/api/maps', async (req, res) => {
    try {
      if (!mapsCollection) return res.json({ maps: [] });
      const maps = await mapsCollection.find().sort({ createdAt: -1 }).toArray();
      res.json({ maps });
    } catch (err) {
      console.error('Fetch maps error', err);
      res.status(500).json({ error: '获取图册失败' });
    }
  });

  app.post('/api/maps', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!mapsCollection) return res.status(500).json({ error: '数据库未连接' });
      const { name, mapData } = req.body;
      if (!name || !mapData) return res.status(400).json({ error: '地图名称和数据不能为空' });
      
      await mapsCollection.insertOne({
         name: name.trim(),
         mapData,
         createdAt: new Date()
      });
      res.json({ message: '上传成功' });
    } catch (err) {
      console.error('Upload map error', err);
      res.status(500).json({ error: '上传失败' });
    }
  });

  app.delete('/api/maps/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!mapsCollection) return res.status(500).json({ error: '数据库未连接' });
      await mapsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: '删除成功' });
    } catch (err) {
      console.error('Delete map error', err);
      res.status(500).json({ error: '删除失败' });
    }
  });

  app.put('/api/maps/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!mapsCollection) return res.status(500).json({ error: '数据库未连接' });
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: '新名称不能为空' });
      
      await mapsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { name: name.trim() } }
      );
      res.json({ message: '重命名成功' });
    } catch (err) {
      console.error('Rename map error', err);
      res.status(500).json({ error: '重命名失败' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Socket.io logic
  const rooms = new Map<string, any>();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (roomId: string, playerId: string, playerName: string) => {
      console.log('User joining room:', roomId, playerId);
      socket.join(roomId);
      
      let room = rooms.get(roomId);
      console.log('Room found:', !!room);
      if (!room) {
        room = {
          roomId,
          hostId: playerId,
          players: [],
          spectators: [],
          settings: {
            playerCount: 4,
            mapType: 'archipelago',
            botConfig: [false, false, false, false]
          }
        };
        rooms.set(roomId, room);
        console.log('Created room:', roomId, JSON.stringify(room));
      }
      
      const existingPlayer = room.players.find((p: any) => p.id === playerId);
      if (!existingPlayer) {
        // If game started or room full, join as spectator
        if (room.gameState || (room.players.length >= (room.settings?.playerCount || 4))) {
          if (!room.spectators) room.spectators = [];
          const existingSpectator = room.spectators.find((s: any) => s.id === playerId);
          if (!existingSpectator) {
            room.spectators.push({ id: playerId, name: playerName, socketId: socket.id });
          } else {
            existingSpectator.socketId = socket.id;
          }
        } else {
          room.players.push({ id: playerId, name: playerName, isReady: false, socketId: socket.id, disconnected: false });
        }
      } else {
        existingPlayer.socketId = socket.id;
        existingPlayer.name = playerName;
        existingPlayer.disconnected = false;
        // Don't reset ready status if game is already started, so they don't block the UI
        if (!room.gameState) {
          existingPlayer.isReady = false; 
        }
      }
      
      // Fallback: if server thinks current host is a bot or disconnected
      const currentHost = room.players.find((p: any) => p.id === room.hostId);
      if (!currentHost || currentHost.isBot || currentHost.disconnected) {
        room.hostId = playerId;
      }
      
      io.to(roomId).emit('room_state', room);
      
      if (room.gameState) {
        socket.emit('game_init', room.gameState);
      }
    });

    socket.on('leave_room', (roomId: string, playerId: string) => {
      console.log('User leaving room:', roomId, playerId);
      socket.leave(roomId);
      
      const room = rooms.get(roomId);
      if (room) {
        // Handle spectator leaving
        const spectatorIndex = room.spectators?.findIndex((s: any) => s.id === playerId);
        if (spectatorIndex !== undefined && spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
          io.to(roomId).emit('room_state', room);
          return;
        }

        if (!room.gameState) {
          room.players = room.players.filter((p: any) => p.id !== playerId);
          if (room.hostId === playerId && room.players.length > 0) {
            room.hostId = room.players[0].id;
          }
        } else {
          const player = room.players.find((p: any) => p.id === playerId);
          if (player) {
            player.disconnected = true;
            console.log('Player marked disconnected:', playerId);
            // Do not transfer host if the game has started, keep identity
          }
        }
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('room_state', room);
        }
      }
    });

    socket.on('toggle_ready', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find((p: any) => p.id === playerId);
        if (player) {
          player.isReady = !player.isReady;
          io.to(roomId).emit('room_state', room);
        }
      }
    });

    socket.on('update_settings', (roomId: string, playerId: string, settings: any) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === playerId) {
        room.settings = settings;
        io.to(roomId).emit('room_state', room);
      }
    });

    socket.on('update_game_state', async (roomId: string, gameState: any) => {
      const room = rooms.get(roomId);
      if (room) {
        // If a winner is just declared, save game using gamesCollection
        if (gameState && gameState.winnerId !== undefined && gameState.winnerId !== null && 
            (!room.gameState || room.gameState.winnerId === undefined || room.gameState.winnerId === null)) {
            
            if (gamesCollection) {
              const gameRecord = {
                 roomId,
                 players: gameState.players.map((p: any) => ({
                   id: p.id,
                   name: p.name,
                   isBot: p.isBot,
                   score: p.score
                 })),
                 winnerId: gameState.winnerId,
                 turnCount: gameState.turn,
                 mapType: room.settings?.mapType,
                 completedAt: new Date()
              };
              try {
                await gamesCollection.insertOne(gameRecord);
                console.log(`[Server] Game ${roomId} result saved.`);
              } catch(e) {
                console.error('Failed to save game result:', e);
              }
            }
        }
        room.gameState = gameState;
      }
      socket.broadcast.to(roomId).emit('game_state_updated', gameState);
    });

    socket.on('react_to_trade', (roomId: string, tradeId: string, playerId: number, reaction: 'accept' | 'reject') => {
      const room = rooms.get(roomId);
      if (room && room.gameState && room.gameState.tradeOffers) {
        const offers = room.gameState.tradeOffers;
        const index = offers.findIndex((o: any) => o.id === tradeId);
        if (index !== -1) {
          const offer = offers[index];
          if (reaction === 'accept') {
            if (!offer.acceptedBy.includes(playerId)) offer.acceptedBy.push(playerId);
            offer.rejectedBy = offer.rejectedBy.filter((id: number) => id !== playerId);
          } else {
            if (!offer.rejectedBy.includes(playerId)) offer.rejectedBy.push(playerId);
            offer.acceptedBy = offer.acceptedBy.filter((id: number) => id !== playerId);
          }
          io.to(roomId).emit('game_state_updated', room.gameState);
        }
      }
    });

    socket.on('finalize_trade', (roomId: string, tradeId: string, partnerId: number) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        const prev = room.gameState;
        const offer = (prev.tradeOffers || []).find((o: any) => o.id === tradeId);
        if (!offer) return;
        const initiator = prev.players.find((p: any) => p.id === offer.initiatorId);
        const partner = prev.players.find((p: any) => p.id === partnerId);
        if (!initiator || !partner) return;

        // Perform trade
        for (const [res, amount] of Object.entries(offer.request)) {
          initiator.resources[res as string] = (initiator.resources[res as string] || 0) + (amount as number);
          partner.resources[res as string] -= (amount as number);
        }
        for (const [res, amount] of Object.entries(offer.offer)) {
          initiator.resources[res as string] -= (amount as number);
          partner.resources[res as string] = (partner.resources[res as string] || 0) + (amount as number);
        }

        offer.status = 'completed';
        offer.completedWith = partnerId;
        io.to(roomId).emit('game_state_updated', room.gameState);
      }
    });

    socket.on('request_sync', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        // Send the cached game state only to the player who requested it
        socket.emit('game_state_updated', room.gameState);
        socket.emit('room_state', room);
      }
    });

    socket.on('reclaim_slot', (roomId: string, newPlayerId: string, oldPlayerId: string) => {
      const room = rooms.get(roomId);
      if (room && room.gameState) {
        // Find the old player in the room list
        const oldPlayerIndex = room.players.findIndex((p: any) => p.id === oldPlayerId);
        if (oldPlayerIndex !== -1 && room.players[oldPlayerIndex].disconnected) {
          // Update the room player list
          room.players[oldPlayerIndex].id = newPlayerId;
          room.players[oldPlayerIndex].socketId = socket.id;
          room.players[oldPlayerIndex].disconnected = false;
          
          // If the old player was the host, transfer host
          if (room.hostId === oldPlayerId) {
            room.hostId = newPlayerId;
          }
          
          // Update the gameState internal player list
          const gamePlayer = room.gameState.players.find((p: any) => p.sessionId === oldPlayerId);
          if (gamePlayer) {
            gamePlayer.sessionId = newPlayerId;
          }
          
          // Fallback: If current host is a bot or offline, or if the old player was host
          const currentHost = room.players.find((p: any) => p.id === room.hostId);
          if (room.hostId === oldPlayerId || !currentHost || currentHost.isBot || currentHost.disconnected) {
            room.hostId = newPlayerId;
          }
          
          io.to(roomId).emit('room_state', room);
          io.to(roomId).emit('game_state_updated', room.gameState);
        }
      }
    });

    socket.on('start_game', (roomId: string, initialGameState: any) => {
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = initialGameState;
      }
      io.to(roomId).emit('game_init', initialGameState);
    });

    socket.on('return_to_lobby', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === playerId) {
        room.gameState = null;
        room.players.forEach((p: any) => {
          p.isReady = false;
        });
        io.to(roomId).emit('room_state', room);
        io.to(roomId).emit('returned_to_lobby');
      }
    });

    socket.on('reset_game', (roomId: string, playerId: string) => {
      const room = rooms.get(roomId);
      // Allow host to reset anytime, or any player to reset if the game is already finished
      if (room && (room.hostId === playerId || (room.gameState && room.gameState.winnerId !== null))) {
        rooms.delete(roomId);
        io.to(roomId).emit('game_reset');
        // Let the clients process the reset event before severing their room connection
        setTimeout(() => {
          io.in(roomId).socketsLeave(roomId);
        }, 100);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      for (const [roomId, room] of rooms.entries()) {
        const spectatorIndex = room.spectators?.findIndex((s: any) => s.socketId === socket.id);
        if (spectatorIndex !== undefined && spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
          io.to(roomId).emit('room_state', room);
          break;
        }

        const playerIndex = room.players.findIndex((p: any) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          if (!room.gameState) {
            const removedPlayer = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            if (room.hostId === removedPlayer.id && room.players.length > 0) {
              room.hostId = room.players[0].id;
            }
          } else {
            room.players[playerIndex].disconnected = true;
            console.log('Player marked disconnected:', room.players[playerIndex].id);
            // Do not transfer host if the game has started, keep identity
          }
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room_state', room);
          }
          break;
        }
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
    console.log(`[Server] Socket.io path: /socket.io`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

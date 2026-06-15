import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken } from '../middleware/auth';

const router = Router();

// 注册
router.post('/register', (req: Request, res: Response) => {
  try {
    const { phone, password, name } = req.body;

    if (!phone || !password || !name) {
      res.status(400).json({ error: '手机号、密码和姓名不能为空' });
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      res.status(400).json({ error: '请输入有效的手机号' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码至少6位' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      res.status(400).json({ error: '该手机号已注册' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (phone, password, name) VALUES (?, ?, ?)').run(phone, hashedPassword, name);

    const token = generateToken(result.lastInsertRowid as number, 'member');
    res.json({
      message: '注册成功',
      token,
      user: { id: result.lastInsertRowid, phone, name, role: 'member' }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
router.post('/login', (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ error: '手机号和密码不能为空' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!user) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }

    const token = generateToken(user.id, user.role);
    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取当前用户信息
router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, 'gym-pass-secret-key-2024') as { userId: number };

    const user = db.prepare('SELECT id, phone, name, role, created_at FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json(user);
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
});

export default router;

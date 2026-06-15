import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { generateVerifyCode, isExpired, formatDate } from '../utils/helpers';

const router = Router();

// 生成核销码
router.post('/generate-code', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { passId } = req.body;

    const pass = db.prepare(
      "SELECT * FROM user_passes WHERE id = ? AND user_id = ? AND status = 'active'"
    ).get(passId, userId) as any;

    if (!pass) {
      res.status(404).json({ error: '次卡不存在或已失效' });
      return;
    }

    if (isExpired(pass.end_date)) {
      db.prepare("UPDATE user_passes SET status = 'expired' WHERE id = ?").run(passId);
      res.status(400).json({ error: '次卡已过期' });
      return;
    }

    if (pass.remaining_times <= 0) {
      res.status(400).json({ error: '次数已用完，请续费' });
      return;
    }

    const verifyCode = generateVerifyCode();
    res.json({ verifyCode, passId: pass.id, message: '验证码已生成' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 核销入场
router.post('/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { passId, verifyCode } = req.body;

    if (!passId || !verifyCode) {
      res.status(400).json({ error: '次卡ID和验证码不能为空' });
      return;
    }

    const pass = db.prepare(
      "SELECT * FROM user_passes WHERE id = ? AND user_id = ? AND status = 'active'"
    ).get(passId, userId) as any;

    if (!pass) {
      res.status(404).json({ error: '次卡不存在或已失效' });
      return;
    }

    if (isExpired(pass.end_date)) {
      db.prepare("UPDATE user_passes SET status = 'expired' WHERE id = ?").run(passId);
      res.status(400).json({ error: '次卡已过期，请续费' });
      return;
    }

    if (pass.remaining_times <= 0) {
      res.status(400).json({ error: '次数已用完，请续费' });
      return;
    }

    // 记录核销
    db.prepare(
      `INSERT INTO checkin_records (user_id, user_pass_id, verify_code) VALUES (?, ?, ?)`
    ).run(userId, passId, verifyCode);

    // 次数减一
    db.prepare(
      'UPDATE user_passes SET remaining_times = remaining_times - 1 WHERE id = ?'
    ).run(passId);

    // 检查是否用完
    const updatedPass = db.prepare('SELECT remaining_times FROM user_passes WHERE id = ?').get(passId) as any;
    if (updatedPass.remaining_times <= 0) {
      db.prepare("UPDATE user_passes SET status = 'used_up' WHERE id = ?").run(passId);
    }

    res.json({
      message: '核销成功，欢迎入场',
      remainingTimes: updatedPass.remaining_times
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取入场记录
router.get('/records', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const records = db.prepare(`
      SELECT cr.*, pt.name as pass_type_name
      FROM checkin_records cr
      JOIN user_passes up ON cr.user_pass_id = up.id
      JOIN pass_types pt ON up.pass_type_id = pt.id
      WHERE cr.user_id = ?
      ORDER BY cr.checkin_time DESC
    `).all(userId);

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 按月统计入场次数
router.get('/stats/monthly', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = db.prepare(`
      SELECT strftime('%Y-%m', checkin_time) as month, COUNT(*) as count
      FROM checkin_records
      WHERE user_id = ?
      GROUP BY month
      ORDER BY month DESC
    `).all(userId);

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

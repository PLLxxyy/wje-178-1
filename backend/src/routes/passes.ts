import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { addDays, formatDate, generateVerifyCode } from '../utils/helpers';

const router = Router();

// 获取所有次卡套餐
router.get('/types', (req: AuthRequest, res: Response) => {
  try {
    const types = db.prepare('SELECT * FROM pass_types ORDER BY price ASC').all();
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 购买次卡
router.post('/purchase', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { passTypeId } = req.body;
    const userId = req.userId!;

    const passType = db.prepare('SELECT * FROM pass_types WHERE id = ?').get(passTypeId) as any;
    if (!passType) {
      res.status(404).json({ error: '套餐不存在' });
      return;
    }

    const now = new Date();
    const endDate = addDays(now, passType.duration_days);
    const verifyCode = generateVerifyCode();

    const result = db.prepare(
      `INSERT INTO user_passes (user_id, pass_type_id, remaining_times, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, passTypeId, passType.times, formatDate(now), formatDate(endDate));

    // 生成核销记录初始条目用于记录验证码
    db.prepare(
      `INSERT INTO checkin_records (user_id, user_pass_id, verify_code, checkin_time)
       VALUES (?, ?, ?, ?)`
    ).run(userId, result.lastInsertRowid, verifyCode, formatDate(now));

    // 删除上面的临时记录，改为在user_passes上存验证码
    db.prepare('DELETE FROM checkin_records WHERE user_pass_id = ? AND checkin_time = ?').run(result.lastInsertRowid, formatDate(now));

    res.json({
      message: '购买成功',
      pass: {
        id: result.lastInsertRowid,
        passType: passType.name,
        remainingTimes: passType.times,
        startDate: formatDate(now),
        endDate: formatDate(endDate),
        verifyCode
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取我的次卡列表
router.get('/my', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const passes = db.prepare(`
      SELECT up.*, pt.name as pass_type_name, pt.type as pass_type, pt.price
      FROM user_passes up
      JOIN pass_types pt ON up.pass_type_id = pt.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `).all(userId);

    res.json(passes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 生成核销码
router.post('/:id/verify-code', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const passId = req.params.id;
    const userId = req.userId!;

    const pass = db.prepare('SELECT * FROM user_passes WHERE id = ? AND user_id = ?').get(passId, userId) as any;
    if (!pass) {
      res.status(404).json({ error: '次卡不存在' });
      return;
    }

    if (pass.status !== 'active') {
      res.status(400).json({ error: '次卡已失效' });
      return;
    }

    const verifyCode = generateVerifyCode();
    res.json({ verifyCode, passId: pass.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

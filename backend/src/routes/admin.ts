import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';
import { formatDate } from '../utils/helpers';

const router = Router();

// 管理员后台统计
router.get('/stats', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    // 今日入场人数
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = db.prepare(`
      SELECT COUNT(*) as count FROM checkin_records
      WHERE date(checkin_time) = date('now', 'localtime')
    `).get() as any;

    // 团课满座率
    const classStats = db.prepare(`
      SELECT
        COUNT(*) as total_classes,
        AVG(CAST(current_booked AS FLOAT) / max_capacity * 100) as avg_fill_rate,
        SUM(CASE WHEN current_booked >= max_capacity THEN 1 ELSE 0 END) as full_classes
      FROM group_classes
      WHERE status != 'cancelled'
    `).get() as any;

    // 次卡销售统计
    const passSales = db.prepare(`
      SELECT pt.name, COUNT(*) as count, SUM(pt.price) as revenue
      FROM user_passes up
      JOIN pass_types pt ON up.pass_type_id = pt.id
      GROUP BY pt.name
    `).all();

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(pt.price), 0) as total
      FROM user_passes up
      JOIN pass_types pt ON up.pass_type_id = pt.id
    `).get() as any;

    // 会员活跃度排行
    const memberRanking = db.prepare(`
      SELECT u.name, u.phone, COUNT(cr.id) as checkin_count
      FROM users u
      LEFT JOIN checkin_records cr ON u.id = cr.user_id
      WHERE u.role = 'member'
      GROUP BY u.id
      ORDER BY checkin_count DESC
      LIMIT 10
    `).all();

    // 总会员数
    const totalMembers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'member'`).get() as any;

    // 总次卡销售数
    const totalPassSales = db.prepare(`SELECT COUNT(*) as count FROM user_passes`).get() as any;

    res.json({
      todayCheckins: todayCheckins.count,
      classStats: {
        totalClasses: classStats.total_classes || 0,
        avgFillRate: Math.round(classStats.avg_fill_rate || 0),
        fullClasses: classStats.full_classes || 0
      },
      passSales,
      totalRevenue: totalRevenue.total,
      memberRanking,
      totalMembers: totalMembers.count,
      totalPassSales: totalPassSales.count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员创建团课
router.post('/classes', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, coach, classTime, maxCapacity } = req.body;

    if (!name || !coach || !classTime || !maxCapacity) {
      res.status(400).json({ error: '课程名称、教练、上课时间和名额上限不能为空' });
      return;
    }

    if (maxCapacity < 1) {
      res.status(400).json({ error: '名额上限至少为1' });
      return;
    }

    const result = db.prepare(
      `INSERT INTO group_classes (name, description, coach, class_time, max_capacity)
       VALUES (?, ?, ?, ?, ?)`
    ).run(name, description || '', coach, classTime, maxCapacity);

    res.json({
      message: '团课创建成功',
      class: { id: result.lastInsertRowid, name, description, coach, classTime, maxCapacity }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员更新团课
router.put('/classes/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const { name, description, coach, classTime, maxCapacity, status } = req.body;

    const cls = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(classId) as any;
    if (!cls) {
      res.status(404).json({ error: '团课不存在' });
      return;
    }

    db.prepare(`
      UPDATE group_classes SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        coach = COALESCE(?, coach),
        class_time = COALESCE(?, class_time),
        max_capacity = COALESCE(?, max_capacity),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, description, coach, classTime, maxCapacity, status, classId);

    res.json({ message: '团课更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员删除团课
router.delete('/classes/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;
    db.prepare("UPDATE group_classes SET status = 'cancelled' WHERE id = ?").run(classId);
    db.prepare("UPDATE class_bookings SET status = 'cancelled' WHERE class_id = ? AND status IN ('booked', 'waitlisted')").run(classId);
    res.json({ message: '团课已取消' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 发布器械维护公告
router.post('/announcements', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { title, content, type } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: '标题和内容不能为空' });
      return;
    }

    const result = db.prepare(
      `INSERT INTO announcements (title, content, type) VALUES (?, ?, ?)`
    ).run(title, content, type || 'maintenance');

    res.json({ message: '公告发布成功', id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取公告列表
router.get('/announcements', (req: AuthRequest, res: Response) => {
  try {
    const announcements = db.prepare(
      'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20'
    ).all();
    res.json(announcements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除公告
router.delete('/announcements/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const annId = req.params.id;
    db.prepare('DELETE FROM announcements WHERE id = ?').run(annId);
    res.json({ message: '公告已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有入场记录（管理员）
router.get('/checkin-records', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const records = db.prepare(`
      SELECT cr.*, u.name as user_name, u.phone as user_phone, pt.name as pass_type_name
      FROM checkin_records cr
      JOIN users u ON cr.user_id = u.id
      JOIN user_passes up ON cr.user_pass_id = up.id
      JOIN pass_types pt ON up.pass_type_id = pt.id
      ORDER BY cr.checkin_time DESC
      LIMIT 100
    `).all();

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有会员列表（管理员）
router.get('/members', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const members = db.prepare(`
      SELECT u.id, u.phone, u.name, u.role, u.created_at,
        (SELECT COUNT(*) FROM checkin_records cr WHERE cr.user_id = u.id) as total_checkins,
        (SELECT COUNT(*) FROM user_passes up WHERE up.user_id = u.id AND up.status = 'active') as active_passes
      FROM users u
      WHERE u.role = 'member'
      ORDER BY u.created_at DESC
    `).all();

    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

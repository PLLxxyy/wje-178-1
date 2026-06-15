import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// 获取团课列表
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const classes = db.prepare(`
      SELECT gc.*,
        (SELECT COUNT(*) FROM class_bookings cb WHERE cb.class_id = gc.id AND cb.status = 'booked') as booked_count,
        (SELECT COUNT(*) FROM class_bookings cb WHERE cb.class_id = gc.id AND cb.status = 'waitlisted') as waitlist_count
      FROM group_classes gc
      WHERE gc.status != 'cancelled'
      ORDER BY gc.class_time ASC
    `).all();

    res.json(classes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 预约团课
router.post('/:id/book', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const userId = req.userId!;

    const cls = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(classId) as any;
    if (!cls) {
      res.status(404).json({ error: '团课不存在' });
      return;
    }

    if (cls.status === 'cancelled' || cls.status === 'completed') {
      res.status(400).json({ error: '该团课已取消或已结束' });
      return;
    }

    // 检查是否已预约
    const existingBooking = db.prepare(
      "SELECT * FROM class_bookings WHERE class_id = ? AND user_id = ? AND status IN ('booked', 'waitlisted')"
    ).get(classId, userId);

    if (existingBooking) {
      res.status(400).json({ error: '您已预约该团课' });
      return;
    }

    // 检查当前预约人数
    const currentBooked = db.prepare(
      "SELECT COUNT(*) as cnt FROM class_bookings WHERE class_id = ? AND status = 'booked'"
    ).get(classId) as any;

    if (currentBooked.cnt >= cls.max_capacity) {
      // 名额已满，加入候补
      const waitlistCount = db.prepare(
        "SELECT COUNT(*) as cnt FROM class_bookings WHERE class_id = ? AND status = 'waitlisted'"
      ).get(classId) as any;

      db.prepare(
        `INSERT INTO class_bookings (class_id, user_id, status, queue_position)
         VALUES (?, ?, 'waitlisted', ?)`
      ).run(classId, userId, waitlistCount.cnt + 1);

      res.json({
        message: '名额已满，已加入候补队列',
        status: 'waitlisted',
        position: waitlistCount.cnt + 1
      });
      return;
    }

    db.prepare(
      `INSERT INTO class_bookings (class_id, user_id, status)
       VALUES (?, ?, 'booked')`
    ).run(classId, userId);

    db.prepare('UPDATE group_classes SET current_booked = current_booked + 1 WHERE id = ?').run(classId);

    res.json({ message: '预约成功', status: 'booked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 取消预约
router.post('/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const userId = req.userId!;

    const booking = db.prepare(
      "SELECT * FROM class_bookings WHERE class_id = ? AND user_id = ? AND status IN ('booked', 'waitlisted')"
    ).get(classId, userId) as any;

    if (!booking) {
      res.status(404).json({ error: '未找到预约记录' });
      return;
    }

    db.prepare("UPDATE class_bookings SET status = 'cancelled' WHERE id = ?").run(booking.id);

    if (booking.status === 'booked') {
      db.prepare('UPDATE group_classes SET current_booked = current_booked - 1 WHERE id = ?').run(classId);

      // 候补递补机制
      const nextWaitlisted = db.prepare(
        "SELECT * FROM class_bookings WHERE class_id = ? AND status = 'waitlisted' ORDER BY queue_position ASC LIMIT 1"
      ).get(classId) as any;

      if (nextWaitlisted) {
        db.prepare("UPDATE class_bookings SET status = 'booked', queue_position = NULL WHERE id = ?").run(nextWaitlisted.id);
        db.prepare('UPDATE group_classes SET current_booked = current_booked + 1 WHERE id = ?').run(classId);

        // 更新剩余候补队列位置
        db.prepare(
          "UPDATE class_bookings SET queue_position = queue_position - 1 WHERE class_id = ? AND status = 'waitlisted'"
        ).run(classId);
      }
    }

    res.json({ message: '取消预约成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取我的团课预约
router.get('/my', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const bookings = db.prepare(`
      SELECT cb.*, gc.name, gc.description, gc.coach, gc.class_time, gc.max_capacity,
        (SELECT COUNT(*) FROM class_bookings cb2 WHERE cb2.class_id = gc.id AND cb2.status = 'booked') as booked_count
      FROM class_bookings cb
      JOIN group_classes gc ON cb.class_id = gc.id
      WHERE cb.user_id = ? AND cb.status IN ('booked', 'waitlisted')
      ORDER BY gc.class_time ASC
    `).all(userId);

    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 团课签到
router.post('/:id/checkin', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;
    const userId = req.userId!;

    const booking = db.prepare(
      "SELECT * FROM class_bookings WHERE class_id = ? AND user_id = ? AND status = 'booked'"
    ).get(classId, userId) as any;

    if (!booking) {
      res.status(404).json({ error: '未找到预约记录或未预约' });
      return;
    }

    if (booking.checked_in) {
      res.status(400).json({ error: '已签到' });
      return;
    }

    db.prepare('UPDATE class_bookings SET checked_in = 1 WHERE id = ?').run(booking.id);
    res.json({ message: '签到成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

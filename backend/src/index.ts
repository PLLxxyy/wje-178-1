import express from 'express';
import cors from 'cors';
import './db';
import authRoutes from './routes/auth';
import passRoutes from './routes/passes';
import classRoutes from './routes/classes';
import checkinRoutes from './routes/checkin';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`健身卡管理系统后端运行在 http://localhost:${PORT}`);
});

export default app;

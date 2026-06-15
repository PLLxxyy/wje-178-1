import db from './db';
import bcrypt from 'bcryptjs';
import { formatDate, addDays, generateVerifyCode } from './utils/helpers';

console.log('正在初始化数据库...');

// 清空所有表
db.exec(`
  DELETE FROM checkin_records;
  DELETE FROM class_bookings;
  DELETE FROM group_classes;
  DELETE FROM user_passes;
  DELETE FROM pass_types;
  DELETE FROM announcements;
  DELETE FROM users;
`);

console.log('数据库已清空，开始插入测试数据...');

// 插入次卡套餐类型
const passTypes = [
  { name: '10次卡', type: 'times', times: 10, durationDays: 90, price: 299, description: '90天内可使用10次' },
  { name: '月卡', type: 'monthly', times: 30, durationDays: 30, price: 199, description: '30天内不限次使用' },
  { name: '季卡', type: 'quarterly', times: 90, durationDays: 90, price: 499, description: '90天内不限次使用' },
  { name: '5次体验卡', type: 'times', times: 5, durationDays: 60, price: 149, description: '60天内可使用5次' },
];

const insertPassType = db.prepare(
  'INSERT INTO pass_types (name, type, times, duration_days, price, description) VALUES (?, ?, ?, ?, ?, ?)'
);

for (const pt of passTypes) {
  insertPassType.run(pt.name, pt.type, pt.times, pt.durationDays, pt.price, pt.description);
}
console.log(`已插入 ${passTypes.length} 个次卡套餐`);

// 插入用户
const adminPassword = bcrypt.hashSync('admin123', 10);
const userPassword = bcrypt.hashSync('user123', 10);

const insertUser = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)');

const users = [
  { phone: '13800000001', password: adminPassword, name: '管理员', role: 'admin' },
  { phone: '13800000002', password: userPassword, name: '张三', role: 'member' },
  { phone: '13800000003', password: userPassword, name: '李四', role: 'member' },
  { phone: '13800000004', password: userPassword, name: '王五', role: 'member' },
  { phone: '13800000005', password: userPassword, name: '赵六', role: 'member' },
  { phone: '13800000006', password: userPassword, name: '孙七', role: 'member' },
  { phone: '13800000007', password: userPassword, name: '周八', role: 'member' },
];

for (const u of users) {
  insertUser.run(u.phone, u.password, u.name, u.role);
}
console.log(`已插入 ${users.length} 个用户`);

// 为会员购买次卡
const insertUserPass = db.prepare(
  `INSERT INTO user_passes (user_id, pass_type_id, remaining_times, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)`
);

const now = new Date();
const passPurchases = [
  { userId: 2, passTypeId: 1, remainingTimes: 7, days: 90 },   // 张三 10次卡 还剩7次
  { userId: 2, passTypeId: 2, remainingTimes: 25, days: 30 },   // 张三 月卡 还剩25天
  { userId: 3, passTypeId: 3, remainingTimes: 85, days: 90 },   // 李四 季卡
  { userId: 4, passTypeId: 1, remainingTimes: 3, days: 90 },    // 王五 10次卡 还剩3次
  { userId: 5, passTypeId: 4, remainingTimes: 5, days: 60 },    // 赵六 5次体验卡
  { userId: 6, passTypeId: 2, remainingTimes: 0, days: -5 },    // 孙七 月卡 已用完
  { userId: 7, passTypeId: 3, remainingTimes: 90, days: 90 },   // 周八 季卡
];

for (const pp of passPurchases) {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 10);
  const endDate = addDays(now, pp.days);
  const status = pp.remainingTimes <= 0 ? 'used_up' : (pp.days < 0 ? 'expired' : 'active');
  insertUserPass.run(pp.userId, pp.passTypeId, pp.remainingTimes, formatDate(startDate), formatDate(endDate), status);
}
console.log('已为会员购买次卡');

// 插入核销记录
const insertCheckin = db.prepare(
  `INSERT INTO checkin_records (user_id, user_pass_id, verify_code, checkin_time) VALUES (?, ?, ?, ?)`
);

const checkinData = [
  { userId: 2, passId: 1, daysAgo: 9 },
  { userId: 2, passId: 1, daysAgo: 7 },
  { userId: 2, passId: 1, daysAgo: 5 },
  { userId: 3, passId: 3, daysAgo: 8 },
  { userId: 3, passId: 3, daysAgo: 6 },
  { userId: 3, passId: 3, daysAgo: 4 },
  { userId: 3, passId: 3, daysAgo: 2 },
  { userId: 4, passId: 4, daysAgo: 10 },
  { userId: 4, passId: 4, daysAgo: 8 },
  { userId: 4, passId: 4, daysAgo: 6 },
  { userId: 4, passId: 4, daysAgo: 4 },
  { userId: 4, passId: 4, daysAgo: 2 },
  { userId: 4, passId: 4, daysAgo: 1 },
  { userId: 4, passId: 4, daysAgo: 0 },
  { userId: 6, passId: 6, daysAgo: 30 },
  { userId: 6, passId: 6, daysAgo: 25 },
  { userId: 6, passId: 6, daysAgo: 20 },
];

for (const cd of checkinData) {
  const checkinTime = new Date(now);
  checkinTime.setDate(checkinTime.getDate() - cd.daysAgo);
  checkinTime.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  insertCheckin.run(cd.userId, cd.passId, generateVerifyCode(), formatDate(checkinTime));
}
console.log('已插入核销记录');

// 插入团课
const insertClass = db.prepare(
  `INSERT INTO group_classes (name, description, coach, class_time, max_capacity, current_booked, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const futureDate1 = new Date(now);
futureDate1.setDate(futureDate1.getDate() + 1);
futureDate1.setHours(9, 0, 0);

const futureDate2 = new Date(now);
futureDate2.setDate(futureDate2.getDate() + 1);
futureDate2.setHours(14, 0, 0);

const futureDate3 = new Date(now);
futureDate3.setDate(futureDate3.getDate() + 2);
futureDate3.setHours(10, 0, 0);

const futureDate4 = new Date(now);
futureDate4.setDate(futureDate4.getDate() + 3);
futureDate4.setHours(16, 0, 0);

const futureDate5 = new Date(now);
futureDate5.setDate(futureDate5.getDate() + 5);
futureDate5.setHours(19, 0, 0);

const classes = [
  { name: '晨间瑜伽', desc: '适合初学者的舒缓瑜伽，改善柔韧性和核心力量', coach: '王教练', time: formatDate(futureDate1), max: 15, booked: 12, status: 'open' },
  { name: '动感单车', desc: '高强度燃脂骑行，跟随音乐节奏冲刺', coach: '李教练', time: formatDate(futureDate2), max: 20, booked: 20, status: 'full' },
  { name: '搏击操', desc: '结合拳击和有氧运动，释放压力燃烧卡路里', coach: '赵教练', time: formatDate(futureDate3), max: 12, booked: 8, status: 'open' },
  { name: '普拉提', desc: '核心强化训练，改善体态和身体控制', coach: '王教练', time: formatDate(futureDate4), max: 10, booked: 10, status: 'full' },
  { name: 'HIIT高强度间歇', desc: '短时高效的全身训练，快速提升心肺功能', coach: '李教练', time: formatDate(futureDate5), max: 18, booked: 5, status: 'open' },
];

for (const c of classes) {
  insertClass.run(c.name, c.desc, c.coach, c.time, c.max, c.booked, c.status);
}
console.log(`已插入 ${classes.length} 个团课`);

// 插入团课预约
const insertBooking = db.prepare(
  `INSERT INTO class_bookings (class_id, user_id, status, checked_in) VALUES (?, ?, ?, ?)`
);

const bookings = [
  { classId: 1, userId: 2, status: 'booked', checkedIn: 0 },
  { classId: 1, userId: 3, status: 'booked', checkedIn: 0 },
  { classId: 1, userId: 4, status: 'booked', checkedIn: 0 },
  { classId: 2, userId: 2, status: 'booked', checkedIn: 0 },
  { classId: 2, userId: 3, status: 'booked', checkedIn: 0 },
  { classId: 2, userId: 5, status: 'booked', checkedIn: 0 },
  { classId: 2, userId: 7, status: 'booked', checkedIn: 0 },
  { classId: 2, userId: 4, status: 'waitlisted', checkedIn: 0, queue: 1 },
  { classId: 3, userId: 2, status: 'booked', checkedIn: 0 },
  { classId: 3, userId: 5, status: 'booked', checkedIn: 0 },
  { classId: 5, userId: 3, status: 'booked', checkedIn: 0 },
  { classId: 5, userId: 7, status: 'booked', checkedIn: 0 },
];

for (const b of bookings) {
  insertBooking.run(b.classId, b.userId, b.status, b.checkedIn);
}
console.log('已插入团课预约');

// 插入公告
const insertAnnouncement = db.prepare(
  `INSERT INTO announcements (title, content, type) VALUES (?, ?, ?)`
);

const announcements = [
  { title: '跑步机3号维修通知', content: '3号跑步机出现故障，预计维修3天（6月15日-6月18日），请使用其他跑步机。', type: 'maintenance' },
  { title: '新增动感单车教室', content: '二楼新增动感单车教室，可容纳25人，欢迎预约体验！', type: 'info' },
  { title: '6月团课安排', content: '本月新增搏击操课程，每周三、周五下午4点开课，名额有限先到先得。', type: 'info' },
];

for (const a of announcements) {
  insertAnnouncement.run(a.title, a.content, a.type);
}
console.log('已插入公告');

console.log('\n测试数据初始化完成！');
console.log('\n测试账号：');
console.log('管理员: 13800000001 / admin123');
console.log('会员:   13800000002 / user123');
console.log('会员:   13800000003 / user123');
console.log('会员:   13800000004 / user123');
console.log('会员:   13800000005 / user123');

import React, { useEffect, useState } from 'react';
import StatisticsChart from '../components/StatisticsChart';

export default function StatisticsReport() {
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        setRegisteredUsers(data.registered);
        setActiveUsers(data.active);
        setPostsCount(data.posts);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className='py-20 px-4 max-w-6xl mx-auto text-center'>
      <h1 className='text-3xl font-bold mb-4 text-slate-700'>Báo Cáo Thống Kê</h1>
      <p className='mb-4 text-slate-700'>
      Tại đây bạn có thể tìm thấy nhiều số liệu thống kê khác nhau liên quan đến hiệu suất nền tảng của trang.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Tổng số người dùng đã đăng ký</h2>
          <p className="text-2xl font-bold text-blue-600">{registeredUsers}</p>
        </div>
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Tổng số người dùng đang hoạt động</h2>
          <p className="text-2xl font-bold text-blue-600">{activeUsers}</p>
        </div>
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Tổng số bài viết</h2>
          <p className="text-2xl font-bold text-blue-600">{postsCount}</p>
        </div>
      </div>
      {/* Thêm StatisticsChart vào đây */}
      <StatisticsChart registeredUsers={registeredUsers} activeUsers={activeUsers} postsCount={postsCount} />
    </div>
  );
}

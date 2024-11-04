// src/pages/StatisticsReport.jsx
import React, { useEffect, useState } from 'react';
import StatisticsChart from '../components/StatisticsChart'; // Import component StatisticsChart

export default function StatisticsReport() {
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics'); // Gọi API thống kê
        const data = await response.json();
        setRegisteredUsers(data.registered); // Số người đã đăng ký
        setActiveUsers(data.active); // Số người đang hoạt động
        setPostsCount(data.posts); // Số bài đăng
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className='py-20 px-4 max-w-6xl mx-auto text-center'>
      <h1 className='text-3xl font-bold mb-4 text-slate-700'>Statistics Report</h1>
      <p className='mb-4 text-slate-700'>
        Here you can find various statistics related to your platform's performance.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Total Registered Users</h2>
          <p className="text-2xl font-bold text-blue-600">{registeredUsers}</p>
        </div>
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Active Users</h2>
          <p className="text-2xl font-bold text-blue-600">{activeUsers}</p>
        </div>
        <div className="bg-slate-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-slate-700">Total Posts</h2>
          <p className="text-2xl font-bold text-blue-600">{postsCount}</p>
        </div>
      </div>
      {/* Thêm StatisticsChart vào đây */}
      <StatisticsChart registeredUsers={registeredUsers} activeUsers={activeUsers} postsCount={postsCount} />
    </div>
  );
}

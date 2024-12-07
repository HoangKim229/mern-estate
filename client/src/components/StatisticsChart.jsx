// src/components/StatisticsChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatisticsChart = ({ registeredUsers, activeUsers, postsCount }) => {

  const data = [
    { name: 'Người dùng đã đăng ký', value: registeredUsers },
    { name: 'Người dùng đang hoạt động', value: activeUsers },
    { name: 'Tổng số bài viết', value: postsCount },
  ];

  return (
    <div className="w-full px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-4 text-center">Biểu đồ thống kê</h2>
      <div className="w-full h-[300px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" fill="#4a90e2" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsChart;

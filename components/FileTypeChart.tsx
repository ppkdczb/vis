import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getAggregatedStatsFromTree, getLargestFiles } from '../mockData';
import { DiskNode } from '../types';

interface FileTypeChartProps {
  data: DiskNode;
}

export const FileTypeChart: React.FC<FileTypeChartProps> = ({ data }) => {
  const stats = useMemo(() => getAggregatedStatsFromTree(data), [data]);
  const pieStats = useMemo(() => {
    const topN = 12;
    if (stats.length <= topN) return stats;
    const head = stats.slice(0, topN);
    const tail = stats.slice(topN);
    const other = tail.reduce(
      (acc, item) => {
        acc.value += item.value;
        acc.count += item.count;
        return acc;
      },
      { name: 'Other', value: 0, count: 0, color: '#94a3b8' }
    );
    return [...head, other].filter((item) => item.value > 0);
  }, [stats]);
  const topFiles = useMemo(() => getLargestFiles(data, 6), [data]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-bold text-gray-800">{item.name}</p>
          <p className="text-blue-600">Size: {formatSize(item.value)}</p>
          <p className="text-gray-500 text-sm">Count: {item.count} files</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Donut Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Storage by File Type</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieStats}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">File Count by Type</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                width={60}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                content={({ active, payload }) => {
                   if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-800 text-white p-2 rounded text-xs shadow-xl">
                        {item.count} files
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.slice(0, 4).map((item) => (
            <div key={item.name} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 font-medium mb-1">.{item.name}</div>
                    <div className="text-xl font-bold text-gray-800">{formatSize(item.value)}</div>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center opacity-20" style={{ backgroundColor: item.color }}>
                   <div className="h-3 w-3 rounded-full opacity-100" style={{ backgroundColor: item.color }}></div>
                </div>
            </div>
        ))}
      </div>

      {/* Largest Files */}
      <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Largest Files</h3>
          <span className="text-xs text-gray-500">Top {topFiles.length}</span>
        </div>
        {topFiles.length === 0 ? (
          <div className="text-sm text-gray-500">No files found for this directory.</div>
        ) : (
          <div className="space-y-3">
            {topFiles.map((file, index) => (
              <div key={`${file.path}-${index}`} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                  <div className="text-xs text-gray-500 truncate">{file.path}</div>
                </div>
                <div className="text-sm font-semibold text-gray-700">{formatSize(file.size)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-1 lg:col-span-2 text-sm text-gray-500 text-center">
        使用方法：圆环图查看类型占用，条形图查看数量，列表查看最大文件。
      </div>
    </div>
  );
};

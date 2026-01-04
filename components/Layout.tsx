import React from 'react';
import { LayoutDashboard, FolderTree, PieChart, HardDrive, Orbit } from 'lucide-react';
import { ViewMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeMode, onModeChange }) => {
  const navItems = [
    { mode: ViewMode.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { mode: ViewMode.TREEMAP, label: 'Disk Space Tree', icon: FolderTree },
    { mode: ViewMode.FILETYPES, label: 'File Distribution', icon: PieChart },
    { mode: ViewMode.FORCE, label: 'Force Graph', icon: Orbit },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-lg">
            <HardDrive className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">DiskViz</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => onModeChange(item.mode)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeMode === item.mode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-2">System Status</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300">Storage</span>
              <span className="text-sm text-blue-400">78%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-800">
            {navItems.find(i => i.mode === activeMode)?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last scanned: <span className="font-medium text-gray-700">Today, 10:42 AM</span>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              JS
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

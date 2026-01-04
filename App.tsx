import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { DiskTreemap } from './components/DiskTreemap';
import { FileTypeChart } from './components/FileTypeChart';
import { ForceGraph } from './components/ForceGraph';
import { ViewMode } from './types';
import { MOCK_DISK_DATA, getAggregatedStatsFromTree, getLargestFiles } from './mockData';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { scanDirectory } from './api';

const CATEGORY_MAP: Record<string, string[]> = {
  media: ['MP4', 'AVI', 'MOV', 'MKV', 'MP3', 'WAV', 'FLAC', 'AAC'],
  text: ['TXT', 'TOML', 'JSON', 'MD', 'CSV', 'YAML', 'YML', 'XML', 'LOG'],
  documents: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'],
  archives: ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'],
};

const categorizeExtension = (ext: string) => {
  const upper = ext.toUpperCase();
  if (CATEGORY_MAP.media.includes(upper)) return 'Media';
  if (CATEGORY_MAP.text.includes(upper)) return 'Text';
  return 'Other';
};

interface DashboardProps {
  scanPath: string;
  onScanPathChange: (path: string) => void;
  onScan: () => void;
  scanning: boolean;
  scanError: string | null;
  scanSummary: { fileCount: number; totalSize: number } | null;
  topFile: { name: string; size: number } | null;
  topTypes: { name: string; value: number }[];
  categoryStats: { name: string; value: number }[];
  stats: { name: string; value: number; count: number; color: string }[];
  totalSize: number;
  fileCount: number;
}

const DashboardView: React.FC<DashboardProps> = ({
  scanPath,
  onScanPathChange,
  onScan,
  scanning,
  scanError,
  scanSummary,
  topFile,
  topTypes,
  categoryStats,
  stats,
  totalSize,
  fileCount,
}) => (
  <div className="space-y-6">
    {/* Directory Scan */}
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h4 className="font-semibold text-gray-800">Scan a Directory</h4>
      <p className="text-sm text-gray-600 mt-1">
        Enter a local path; the backend scans it directly at <code className="bg-gray-100 px-1 py-0.5 rounded">POST /api/scan-directory</code>.
      </p>

      <div className="mt-3 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <input
          value={scanPath}
          onChange={(e) => onScanPathChange(e.target.value)}
          placeholder="e.g. /home/ppkdczb/ChatCFD"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          disabled={!scanPath.trim() || scanning}
          onClick={onScan}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
            !scanPath.trim() || scanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {scanning ? 'Scanning...' : 'Scan folder'}
        </button>
      </div>

      {(scanSummary || scanError) && (
        <div className="mt-2 text-sm">
          {scanError ? (
            <span className="text-red-600">Scan error: {scanError}</span>
          ) : (
            <span className="text-gray-700">
              Scanned <span className="font-medium">{scanSummary?.fileCount}</span> files, total{' '}
              <span className="font-medium">{((scanSummary?.totalSize || 0) / (1024 * 1024)).toFixed(2)} MB</span>
            </span>
          )}
        </div>
      )}
      {topFile && (
        <div className="mt-3 text-xs text-gray-500">
          Largest file now: <span className="font-medium text-gray-700">{topFile.name}</span> (
          {(topFile.size / (1024 * 1024)).toFixed(2)} MB)
        </div>
      )}
    </div>

    {/* Top Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
        <h3 className="text-blue-100 font-medium mb-1">Total Used Space</h3>
        <div className="text-3xl font-bold mb-4">{(totalSize / (1024 * 1024)).toFixed(2)} MB</div>
        <div className="w-full bg-blue-800/30 rounded-full h-1.5">
          <div className="bg-white/80 h-1.5 rounded-full" style={{ width: '78%' }}></div>
        </div>
        <p className="text-xs text-blue-100 mt-2">78% of 2.0 GB Allocated</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-500 font-medium mb-1">Total Files</h3>
        <div className="text-3xl font-bold text-gray-800 mb-2">{fileCount}</div>
        <div className="flex items-center text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
          <RefreshCw className="w-3 h-3 mr-1" />
          Updated just now
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-gray-500 font-medium mb-1">Largest File Type</h3>
        <div className="text-3xl font-bold text-gray-800 mb-2">.{stats[0]?.name || 'N/A'}</div>
        <p className="text-sm text-gray-500">{(stats[0]?.value / (1024 * 1024)).toFixed(2)} MB occupied</p>
      </div>
    </div>

    {/* Recent Alerts / Quick Actions */}
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Quick Analysis</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center p-3 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-slate-500" />
          <div className="text-sm">
            <span className="font-semibold">Average file size:</span>{' '}
            {fileCount > 0 ? `${(totalSize / fileCount / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
          </div>
        </div>
        <div className="flex items-center p-3 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100">
          <Download className="w-5 h-5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Top file types:</span>{' '}
            {topTypes.length > 0
              ? topTypes
                  .map((item) => `.${item.name} (${((item.value / Math.max(totalSize, 1)) * 100).toFixed(1)}%)`)
                  .join(', ')
              : 'N/A'}
          </div>
        </div>
        <div className="flex items-center p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-100">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-700" />
          <div className="text-sm">
            <span className="font-bold">Category breakdown:</span>{' '}
            {categoryStats.length > 0
              ? categoryStats
                  .map((item) => `${item.name} (${((item.value / Math.max(totalSize, 1)) * 100).toFixed(1)}%)`)
                  .join(', ')
              : 'N/A'}
          </div>
        </div>
        <div className="flex items-center p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600" />
          <div className="text-sm">
            <span className="font-bold">Largest file:</span>{' '}
            {topFile ? `${topFile.name} (${(topFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'N/A'}
          </div>
        </div>
      </div>
    </div>

    <div className="text-sm text-gray-500 text-center">
      使用方法：输入本地路径，点击“Scan”，再切换到其他页查看可视化结果。
    </div>
  </div>
);

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [scanPath, setScanPath] = useState<string>('/home/ppkdczb/ChatCFD');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<{ fileCount: number; totalSize: number } | null>(null);
  const [diskData, setDiskData] = useState(MOCK_DISK_DATA);
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});

  const stats = getAggregatedStatsFromTree(diskData);
  const totalSize = diskData.size;
  const fileCount = stats.reduce((acc, curr) => acc + curr.count, 0);
  const topFiles = getLargestFiles(diskData, 1);
  const categoryStats = stats.reduce<Record<string, number>>((acc, item) => {
    const category = categorizeExtension(item.name);
    acc[category] = (acc[category] || 0) + item.value;
    return acc;
  }, {});
  const categoryList = Object.entries(categoryStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Layout activeMode={viewMode} onModeChange={setViewMode}>
      {viewMode === ViewMode.DASHBOARD && (
        <DashboardView
          scanPath={scanPath}
          onScanPathChange={setScanPath}
          onScan={async () => {
            if (!scanPath.trim()) return;
            setScanning(true);
            setScanError(null);
            setScanSummary(null);
            try {
              const res = await scanDirectory(scanPath.trim());
              setDiskData(res.root);
              setGroupColors(res.group_colors || {});
              setScanSummary({ fileCount: res.file_count, totalSize: res.total_size });
            } catch (err) {
              setScanError(err instanceof Error ? err.message : String(err));
            } finally {
              setScanning(false);
            }
          }}
          scanning={scanning}
          scanError={scanError}
          scanSummary={scanSummary}
          topFile={topFiles[0] ? { name: topFiles[0].name, size: topFiles[0].size } : null}
          topTypes={stats.slice(0, 3).map((item) => ({ name: item.name, value: item.value }))}
          categoryStats={categoryList}
          stats={stats}
          totalSize={totalSize}
          fileCount={fileCount}
        />
      )}
      {viewMode === ViewMode.TREEMAP && <DiskTreemap data={diskData} groupColors={groupColors} />}
      {viewMode === ViewMode.FILETYPES && <FileTypeChart data={diskData} />}
      {viewMode === ViewMode.FORCE && <ForceGraph data={diskData} />}
    </Layout>
  );
};

export default App;

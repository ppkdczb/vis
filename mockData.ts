import { DiskNode } from './types';

// Helper to create a file
const file = (name: string, sizeMB: number): DiskNode => ({
  name,
  size: sizeMB * 1024 * 1024,
  type: 'file',
  extension: name.split('.').pop()?.toLowerCase() || 'unknown'
});

// Helper to create a dir
const dir = (name: string, children: DiskNode[]): DiskNode => {
  const size = children.reduce((acc, child) => acc + child.size, 0);
  return {
    name,
    size,
    type: 'directory',
    children
  };
};

export const MOCK_DISK_DATA: DiskNode = dir("root", [
  dir("Users", [
    dir("Admin", [
      dir("Documents", [
        file("Project_Report.pdf", 5),
        file("Budget.xlsx", 2),
        file("Notes.txt", 0.1),
        dir("Old_Projects", [
          file("2021_Summary.docx", 3),
          file("2020_Data.csv", 15)
        ])
      ]),
      dir("Downloads", [
        file("Installer_v2.dmg", 150),
        file("Movie_Clip.mp4", 450),
        file("Archive.zip", 200),
        file("Funny_Cat.gif", 5)
      ]),
      dir("Pictures", [
        file("Vacation_01.jpg", 4),
        file("Vacation_02.jpg", 4.2),
        file("Profile_Pic.png", 2),
        dir("Raw_Photos", [
          file("IMG_1001.RAW", 25),
          file("IMG_1002.RAW", 26),
          file("IMG_1003.RAW", 24)
        ])
      ]),
      dir("Music", [
        file("Song_01.mp3", 8),
        file("Song_02.mp3", 7),
        file("Album_Cover.jpg", 1)
      ])
    ])
  ]),
  dir("Applications", [
    dir("Browser", [
      file("Browser.app", 300),
      file("Helper.bin", 50)
    ]),
    dir("Editor", [
      file("Editor.app", 500),
      dir("Plugins", [
        file("Plugin_A.dll", 20),
        file("Plugin_B.dll", 15)
      ])
    ])
  ]),
  dir("System", [
    dir("Logs", [
      file("sys.log", 120),
      file("error.log", 45),
      file("access.log", 200)
    ]),
    dir("Cache", [
      file("temp_001.tmp", 10),
      file("temp_002.tmp", 12)
    ])
  ])
]);

// Utility to aggregate file types from the tree
export const calculateFileTypeStats = (
  node: DiskNode,
  stats: Map<string, { size: number; count: number }> = new Map()
) => {
  if (node.type === 'file' && node.extension) {
    const ext = node.extension.toUpperCase();
    const current = stats.get(ext) || { size: 0, count: 0 };
    stats.set(ext, { size: current.size + node.size, count: current.count + 1 });
  } else if (node.children) {
    node.children.forEach(child => calculateFileTypeStats(child, stats));
  }
  return stats;
};

export const getAggregatedStatsFromTree = (root: DiskNode) => {
  const statsMap = calculateFileTypeStats(root);
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
  ];
  
  return Array.from(statsMap.entries()).map(([name, data], index) => ({
    name,
    value: data.size,
    count: data.count,
    color: colors[index % colors.length]
  })).sort((a, b) => b.value - a.value);
};

export const getAggregatedStats = () => getAggregatedStatsFromTree(MOCK_DISK_DATA);

export const getLargestFiles = (root: DiskNode, limit = 6) => {
  const files: { name: string; path: string; size: number; extension?: string }[] = [];

  const walk = (node: DiskNode, parentPath: string) => {
    if (node.type === 'file') {
      files.push({
        name: node.name,
        path: parentPath ? `${parentPath}/${node.name}` : node.name,
        size: node.size,
        extension: node.extension,
      });
      return;
    }
    node.children?.forEach((child) => walk(child, parentPath ? `${parentPath}/${node.name}` : node.name));
  };

  walk(root, '');
  return files.sort((a, b) => b.size - a.size).slice(0, limit);
};

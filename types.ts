export interface DiskNode {
  name: string;
  size: number; // in bytes
  type: 'file' | 'directory';
  children?: DiskNode[];
  extension?: string;
}

export interface FileTypeStat {
  name: string;
  value: number; // size in bytes
  count: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewMode {
  DASHBOARD = 'dashboard',
  TREEMAP = 'treemap',
  FILETYPES = 'filetypes',
  FORCE = 'force'
}

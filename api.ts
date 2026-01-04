import type { DiskNode } from './types';

export type HealthResponse = {
  status: 'ok';
  time: string;
};

export type EchoResponse = {
  text: string;
  length: number;
};

export type ScanDirectoryResponse = {
  root: DiskNode;
  file_count: number;
  total_size: number;
  group_colors: Record<string, string>;
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch('/api/health', { signal });
  if (!res.ok) throw new Error(`GET /api/health failed: ${res.status}`);
  return res.json();
}

export async function postEcho(text: string, signal?: AbortSignal): Promise<EchoResponse> {
  const res = await fetch('/api/echo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(`POST /api/echo failed: ${res.status}`);
  return res.json();
}

export async function scanDirectory(path: string, maxFiles = 20000, signal?: AbortSignal): Promise<ScanDirectoryResponse> {
  const res = await fetch('/api/scan-directory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, max_files: maxFiles }),
    signal,
  });
  if (!res.ok) throw new Error(`POST /api/scan-directory failed: ${res.status}`);
  return res.json();
}

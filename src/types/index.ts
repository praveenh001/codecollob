export interface FileItem {
  name: string;
  content: string;
  type: 'file';
  createdAt?: Date;
}

export interface FolderItem {
  name: string;
  type: 'folder';
  children: { [key: string]: FileItem | FolderItem };
  expanded?: boolean;
  createdAt?: Date;
}

export type FileSystemItem = FileItem | FolderItem;

export interface User {
  id: string;
  name: string;
  joinedAt?: Date;
}

export interface ExecutionResult {
  output: string;
  error?: boolean;
  exitCode?: number;
}

export const SUPPORTED_LANGUAGES = {
  javascript: { name: 'JavaScript', extensions: ['js', 'jsx'], runner: 'node' },
  typescript: { name: 'TypeScript', extensions: ['ts', 'tsx'], runner: 'ts-node' },
  python: { name: 'Python', extensions: ['py'], runner: 'python3' },
  java: { name: 'Java', extensions: ['java'], runner: 'java' },
  cpp: { name: 'C++', extensions: ['cpp', 'cc', 'cxx'], runner: 'g++' },
  c: { name: 'C', extensions: ['c'], runner: 'gcc' },
  go: { name: 'Go', extensions: ['go'], runner: 'go' },
  rust: { name: 'Rust', extensions: ['rs'], runner: 'rustc' },
  php: { name: 'PHP', extensions: ['php'], runner: 'php' },
  ruby: { name: 'Ruby', extensions: ['rb'], runner: 'ruby' },
  shell: { name: 'Shell', extensions: ['sh', 'bash'], runner: 'bash' },
  html: { name: 'HTML', extensions: ['html', 'htm'], runner: null },
  css: { name: 'CSS', extensions: ['css'], runner: null },
  json: { name: 'JSON', extensions: ['json'], runner: null },
  markdown: { name: 'Markdown', extensions: ['md'], runner: null },
  yaml: { name: 'YAML', extensions: ['yml', 'yaml'], runner: null },
  xml: { name: 'XML', extensions: ['xml'], runner: null }
} as const;

export type LanguageKey = keyof typeof SUPPORTED_LANGUAGES;
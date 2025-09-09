import { FileSystemItem, FileItem, FolderItem } from '../types';

export const createFile = (name: string, content: string = ''): FileItem => ({
  name,
  content,
  type: 'file',
  createdAt: new Date()
});

export const createFolder = (name: string): FolderItem => ({
  name,
  type: 'folder',
  children: {},
  expanded: true,
  createdAt: new Date()
});

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

export const getLanguageFromExtension = (extension: string): string => {
  const langMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sh': 'shell',
    'bash': 'shell',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml'
  };
  
  return langMap[extension] || 'plaintext';
};

export const flattenFileSystem = (items: { [key: string]: FileSystemItem }, prefix: string = ''): { [key: string]: FileItem } => {
  const result: { [key: string]: FileItem } = {};
  
  Object.entries(items).forEach(([key, item]) => {
    const fullPath = prefix ? `${prefix}/${key}` : key;
    
    if (item.type === 'file') {
      result[fullPath] = item;
    } else if (item.type === 'folder') {
      Object.assign(result, flattenFileSystem(item.children, fullPath));
    }
  });
  
  return result;
};

export const findItemByPath = (items: { [key: string]: FileSystemItem }, path: string): FileSystemItem | null => {
  const parts = path.split('/');
  let current: any = items;
  
  for (const part of parts) {
    if (!current[part]) return null;
    current = current[part].type === 'folder' ? current[part].children : current[part];
  }
  
  return current;
};

export const downloadFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadFolder = (folderName: string, items: { [key: string]: FileSystemItem }) => {
  const JSZip = require('jszip');
  const zip = new JSZip();
  
  const addToZip = (items: { [key: string]: FileSystemItem }, folder: any) => {
    Object.entries(items).forEach(([name, item]) => {
      if (item.type === 'file') {
        folder.file(name, item.content);
      } else if (item.type === 'folder') {
        const subFolder = folder.folder(name);
        addToZip(item.children, subFolder);
      }
    });
  };
  
  addToZip(items, zip);
  
  zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};
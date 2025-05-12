import { resolve } from 'path';
import { File } from './file';

/**
 * 工具函数集合
 */
export const utils = {
  apiParams: {
    hitokoto: { all: '', anime: 'c=a', comic: 'c=b', game: 'c=c', novel: 'c=d',
      original: 'c=e', internet: 'c=f', other: 'c=g', movie: 'c=h',
      poetry: 'c=i', netease: 'c=j', philosophy: 'c=k', clever: 'c=l' },
    p6oy: { poetry: 'sc', chicken: 'djt', dog: 'tgrj' }
  },

  /**
   * 初始化工具集合
   * @param baseDir 基础目录路径
   * @param logger 日志记录器
   */
  init(baseDir: string, logger: any) {
    this.baseDir = baseDir;
    this.logger = logger;
    this.file = new File(logger);
  },

  /**
   * 带超时的网络请求
   */
  async fetch(url: string, options: RequestInit = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * 格式化引用文本
   */
  formatCitation(content: string, citation: string) {
    const getWidth = (text: string) => [...text].reduce((w, c) =>
      w + (/[\u4e00-\u9fa5\u3000-\u30ff\u3130-\u318f\uac00-\ud7af]/.test(c) ? 2 : 1), 0);
    const spaces = Math.max(0, Math.min(getWidth(content), 36) - getWidth(citation));
    return `${content}\n${' '.repeat(spaces)}${citation}`;
  },

  /**
   * 获取API内容
   * @param type API类型 ('hitokoto'/'p6oy')
   * @param param 类型参数
   */
  async getApiContent(type: string, param: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      let url, data;
      if (type === 'hitokoto') {
        url = `https://v1.hitokoto.cn/${param ? `?${param}` : ''}`;
      } else if (type === 'p6oy') {
        const typeParam = this.apiParams.p6oy[param] || 'sc';
        url = `https://api.p6oy.top/api/yy?type=${typeParam}`;
      } else {
        return { success: false, error: '无效的 API 类型' };
      }
      const res = await this.fetch(url, {}, 3000);
      if (!res.ok) return { success: false, error: `请求失败: ${res.status}` };
      data = await res.json();
      if (!data?.hitokoto) return { success: false, error: `获取${type}内容失败` };
      let result = data.hitokoto;
      if (type === 'hitokoto' && data.from) {
        const showAuthor = data.from_who && data.from_who !== data.from;
        const citation = `——${showAuthor ? ` ${data.from_who}` : ''}《${data.from}》`;
        result = this.formatCitation(data.hitokoto, citation);
      } else if (type === 'p6oy' && data.hitokoto_from) {
        result = this.formatCitation(data.hitokoto, `——《${data.hitokoto_from}》`);
      }
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: `获取${type}内容出错: ${e.message}` };
    }
  },

  /**
   * 获取本地或网络JSON内容
   */
  async getJsonContent(path: string, cmdName: string): Promise<any[]> {
    // 处理本地文件
    if (!path.startsWith('http')) {
      try {
        const content = await this.file.readTextFile(path);
        return content ? JSON.parse(content).filter(Array.isArray) : [];
      } catch (e) {
        this.logger.error(`解析本地 JSON 失败: ${e.message}`);
        return [];
      }
    }
    // 处理网络JSON
    const contentDir = resolve(this.baseDir, 'data', 'content');
    const filePath = resolve(contentDir, `${cmdName || 'default'}.json`);
    try {
      if (this.file.fileExists(filePath)) {
        const content = await this.file.readTextFile(filePath);
        return content ? JSON.parse(content).filter(Array.isArray) : [];
      }
      if (!await this.file.ensureDirectoryExists(contentDir)) return [];
      const res = await this.fetch(path, {}, 60000);
      if (!res.ok) throw new Error(`下载失败: ${res.status}`);
      await this.file.writeFile(filePath, await res.text());
      const content = await this.file.readTextFile(filePath);
      return content ? JSON.parse(content).filter(Array.isArray) : [];
    } catch (e) {
      this.logger.error('JSON 处理失败:', e);
      return [];
    }
  },

  /**
   * 获取本地图片列表
   */
  async getLocalImages(dirPath: string): Promise<string[]> {
    const files = await this.file.readDirectory(dirPath);
    return files
      .filter(file => this.file.isImageFile(file))
      .map(file => resolve(dirPath, file));
  },

  /**
   * 获取随机内容
   * @param type 内容类型 (image/text/hitokoto/p6oy)
   * @param path 内容路径或参数
   * @param cmdName 命令名称
   */
  async getContent(type: string, path: string, cmdName: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      if (['hitokoto', 'p6oy'].includes(type)) return this.getApiContent(type, path);
      const isImage = type === 'image';
      const contentList = !path.startsWith('http')
        ? isImage ? await this.getLocalImages(path) : await this.getJsonContent(path, cmdName)
        : await this.getJsonContent(path, cmdName || (isImage ? 'images' : 'texts'));
      if (!contentList.length) return { success: false, error: `无可用${isImage ? '图片' : '文本'}` };
      const item = contentList[Math.floor(Math.random() * contentList.length)];
      // 处理图片
      if (isImage) {
        let buffer: Buffer | null;
        if (!item.startsWith('http')) {
          buffer = await this.file.readFile(item);
          if (!buffer) return { success: false, error: `图片文件不存在: ${item}` };
        } else {
          const options: RequestInit = {};
          if (item.startsWith('https://i.pximg.net/')) {
            options.headers = { 'Referer': 'https://www.pixiv.net/' };
          }
          const res = await this.fetch(item, options, 30000);
          if (!res.ok) return { success: false, error: `获取网络图片失败: ${res.status}` };
          buffer = Buffer.from(await res.arrayBuffer());
        }
        return {
          success: true,
          data: `<image src="base64://${buffer.toString('base64')}" type="${this.file.getMimeType(item)}"/>`
        };
      }
      // 处理文本
      return { success: true, data: item };
    } catch (e) {
      this.logger.error(`内容处理失败:`, e);
      return { success: false, error: `处理错误: ${e.message}` };
    }
  }
}
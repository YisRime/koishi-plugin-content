import { Logger } from 'koishi';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { extname } from 'path';

/**
 * 图片扩展名映射到MIME类型
 */
const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp'
};

/**
 * 文件管理工具类
 * 提供文件读写、目录操作等基础功能
 */
export class File {
  /**
   * 创建文件管理实例
   * @param logger 日志记录器
   */
  constructor(private logger: Logger) {}

  /**
   * 检查文件是否为图片
   * @param filename 文件名
   * @returns 是否为支持的图片类型
   */
  isImageFile(filename: string): boolean {
    return Object.keys(IMAGE_MIME_TYPES).includes(extname(filename).toLowerCase());
  }

  /**
   * 获取文件的MIME类型
   * @param filename 文件名
   * @returns MIME类型字符串
   */
  getMimeType(filename: string): string {
    return IMAGE_MIME_TYPES[extname(filename).toLowerCase()] || 'image/jpeg';
  }

  /**
   * 读取目录内容
   * @param dirPath 目录路径
   * @returns 目录内的文件名数组
   */
  async readDirectory(dirPath: string): Promise<string[]> {
    if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
      this.logger.warn(`目录不存在: ${dirPath}`);
      return [];
    }
    try {
      return await readdir(dirPath);
    } catch (error) {
      this.logger.error(`读取目录失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 确保目录存在，不存在则创建
   * @param dirPath 目录路径
   * @returns 操作是否成功
   */
  async ensureDirectoryExists(dirPath: string): Promise<boolean> {
    try {
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      this.logger.error(`创建目录失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 读取文件内容
   * @param filePath 文件的路径
   * @returns 返回文件内容的Buffer，如果读取失败则返回null
   */
  async readFile(filePath: string): Promise<Buffer | null> {
    try {
      if (!this.fileExists(filePath)) {
        this.logger.warn(`文件不存在: ${filePath}`);
        return null;
      }
      return await readFile(filePath);
    } catch (error) {
      this.logger.error(`读取文件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 读取文本文件
   * @param filePath 文件的路径
   * @returns 返回文件内容的字符串，如果读取失败则返回null
   */
  async readTextFile(filePath: string): Promise<string | null> {
    const buffer = await this.readFile(filePath);
    return buffer ? buffer.toString('utf8') : null;
  }

  /**
   * 写入文件
   * @param filePath 要写入的文件路径
   * @param data 要写入的数据，可以是字符串或Buffer
   * @returns 写入操作是否成功
   */
  async writeFile(filePath: string, data: string | Buffer): Promise<boolean> {
    try {
      await writeFile(filePath, data);
      return true;
    } catch (error) {
      this.logger.error(`写入文件失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 文件是否存在
   * @param filePath 要检查的文件路径
   * @returns 文件是否存在
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }
}
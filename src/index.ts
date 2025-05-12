import { Context, Schema, h } from 'koishi'
import { utils } from './utils'

export const name = 'content'

export const usage = `
<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">📌 插件说明</h2>
  <p>📖 <strong>使用文档</strong>：请点击左上角的 <strong>插件主页</strong> 查看插件使用文档</p>
  <p>🔍 <strong>更多插件</strong>：可访问 <a href="https://github.com/YisRime" style="color:#4a6ee0;text-decoration:none;">苡淞的 GitHub</a> 查看本人的所有插件</p>
</div>

<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #e0574a;">❤️ 支持与反馈</h2>
  <p>🌟 喜欢这个插件？请在 <a href="https://github.com/YisRime" style="color:#e0574a;text-decoration:none;">GitHub</a> 上给我一个 Star！</p>
  <p>🐛 遇到问题？请通过 <strong>Issues</strong> 提交反馈，或加入 QQ 群 <a href="https://qm.qq.com/q/PdLMx9Jowq" style="color:#e0574a;text-decoration:none;"><strong>855571375</strong></a> 进行交流</p>
</div>
`

/**
 * 插件配置接口
 * @interface Config
 */
export interface Config {
  commands: Array<{
    name: string
    description: string
    type: 'image' | 'text' | 'hitokoto' | 'p6oy'
    source: string
  }>
}

export const Config: Schema<Config> = Schema.object({
  commands: Schema.array(Schema.object({
    name: Schema.string().description('名称').required(),
    description: Schema.string().description('描述'),
    type: Schema.union([
      Schema.const('image').description('图片'),
      Schema.const('text').description('文本'),
      Schema.const('hitokoto').description('一言'),
      Schema.const('p6oy').description('一言（繁星）')
    ]).description('内容类型').required(),
    source: Schema.string().description('附加参数').required()
  })).description('命令配置').role('table').default([
    { name: 'pixiv', description: '随机 Pixiv 图片', type: 'image', source: 'https://raw.githubusercontent.com/YisRime/koishi-plugin-onebot-tool/main/resource/pixiv.json' },
    { name: 'hitokoto', description: '随机一言', type: 'hitokoto', source: '' },
    { name: 'sjsc', description: '随机诗词', type: 'p6oy', source: 'poetry' },
    { name: 'djt', description: '随机毒鸡汤', type: 'p6oy', source: 'chicken' },
    { name: 'tgrj', description: '随机舔狗日记', type: 'p6oy', source: 'dog' },
  ])
})

/**
 * 插件主函数
 * @param ctx Koishi上下文
 * @param config 插件配置
 */
export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('content')
  utils.init(ctx.baseDir, logger)

  /**
   * 处理并发送内容
   * @param session 会话对象
   * @param cmdName 命令名称
   * @param cmdConfig 命令配置
   * @returns 发送给用户的内容
   */
  async function processContent(cmdName: string, cmdConfig: Config['commands'][0]) {
    try {
      const { type, source } = cmdConfig;
      const result = await utils.getContent(type, source, cmdName);
      return result.success
        ? (type === 'image' ? h.parse(result.data) : result.data)
        : `获取${type === 'image' ? '图片' : type === 'text' ? '文本' : '一言'}失败: ${result.error}`;
    } catch (e) {
      const typeLabel = ['image', 'text'].includes(cmdConfig.type) ?
                        (cmdConfig.type === 'image' ? '图片' : '文本') : '一言';
      logger.error(`发送${typeLabel}失败:`, e);
      return `发送${typeLabel}时出错，请稍后再试`;
    }
  }

  // 注册主命令
  const main = ctx.command('content', '随机内容');
  // 注册子命令
  config.commands.forEach(cmd => {
    main.subcommand(cmd.name, cmd.description)
       .action(({}) => processContent(cmd.name, cmd));
  });
}
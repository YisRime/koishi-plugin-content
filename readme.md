# koishi-plugin-content

[![npm](https://img.shields.io/npm/v/koishi-plugin-content?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-content)

调用 API 返回随机内容或发送本地随机内容

## 简介

koishi-plugin-content 是一个灵活的随机内容生成插件，支持多种内容类型：

- 随机图片（本地图库或网络JSON列表）
- 随机文本（本地或网络JSON）
- 随机一言（调用 hitokoto API）
- 随机一言（调用 p6oy API，包括诗词、毒鸡汤、舔狗日记等）

## 使用方法

安装并启用插件后，将自动注册 `content` 主命令以及配置的子命令。

默认配置包含以下命令：

- `content pixiv` - 随机 Pixiv 图片
- `content hitokoto` - 随机一言
- `content sjsc` - 随机诗词
- `content djt` - 随机毒鸡汤
- `content tgrj` - 随机舔狗日记

## 配置项

在插件配置中，你可以自定义命令列表，每个命令包含以下属性：

| 配置项 | 类型 | 描述 |
|-------|------|------|
| name | string | 命令名称 |
| description | string | 命令描述 |
| type | string | 内容类型，可选值：`image`、`text`、`hitokoto`、`p6oy` |
| source | string | 内容来源或参数 |

### 内容类型与源配置说明

1. **图片类型 (image)**
   - 本地路径：指向包含图片的文件夹
   - 网络路径：指向包含图片URL列表的JSON文件

2. **文本类型 (text)**
   - 本地路径：指向包含文本内容的JSON文件
   - 网络路径：指向包含文本内容的JSON文件

3. **一言类型 (hitokoto)**
   - source 参数可选值：
     - 空字符串：随机所有类型
     - `anime`：动画
     - `comic`：漫画
     - `game`：游戏
     - `novel`：小说
     - `original`：原创
     - `internet`：互联网
     - `other`：其他
     - `movie`：电影
     - `poetry`：诗词
     - `netease`：网易云
     - `philosophy`：哲学
     - `clever`：聪明话

4. **繁星一言类型 (p6oy)**
   - source 参数可选值：
     - `poetry`：诗词
     - `chicken`：毒鸡汤
     - `dog`：舔狗日记

## 自定义内容格式

- 图片JSON格式：包含图片URL的数组
- 文本JSON格式：包含文本字符串的数组

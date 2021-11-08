import fs from 'fs'
import path from 'path'

import deepMerge from './deepMerge.js'
import sortDependencies from './sortDependencies.js'

/**
 * Renders a template folder/file to the file system,
 * by recursively copying all files under the `src` directory,
 * with the following exception:
 *   - `_filename` should be renamed to `.filename`
 *   - Fields in `package.json` should be recursively merged
 * @param {string} src source filename to copy
 * @param {string} dest destination filename of the copy operation
 */
/**
 *
 * @param src  模板文件所在的目录
 * @param dest 生成的目标文件路径
 */
function renderTemplate(src, dest) {
  const stats = fs.statSync(src)
  /**
   * 如果是目录
   */
  if (stats.isDirectory()) {
    // if it's a directory, render its subdirectories and files recusively
    // 如果它是一个目录，则反复渲染其子目录和文件
    fs.mkdirSync(dest, { recursive: true })
    /**
     * fs.readdirSync 同步读取目录内容，返回值为一个数组
     */
    for (const file of fs.readdirSync(src)) {
      /**
       * 以 base 目录为例
       *  template/base/public
       *  /project/public
       *
       *  递归渲染目录下的文件
       */
      renderTemplate(path.resolve(src, file), path.resolve(dest, file))
    }
    return
  }

  /**
   * 获取文件名
   * @type {string}
   */
  const filename = path.basename(src)

  /**
   * 如果模板中存在 package.json 文件
   * 并且，生成的目标项目中也存在 package.json 文件
   * 会将 package.json 文件合并，而不是覆盖
   */
  if (filename === 'package.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    /**
     * 已有的 package.json
     */
    const existing = JSON.parse(fs.readFileSync(dest))
    /**
     * 新的 package.json
     */
    const newPackage = JSON.parse(fs.readFileSync(src))
    const pkg = sortDependencies(deepMerge(existing, newPackage))
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  /**
   * 重命名 _ 开头的文件为 . 开头的文件
   */
  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }

  /**
   * 同步地复制 src 到 dest
   */
  fs.copyFileSync(src, dest)
}

export default renderTemplate

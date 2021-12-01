import fs from 'fs'
import path from 'path'

export function preOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  /**
   * 读取 dir 目录中的文件
   */
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename)
    /**
     * fullpath 是目录
     */
    if (fs.lstatSync(fullpath).isDirectory()) {
      // 如果是目录，先通过 dirCallback 通知外部
      dirCallback(fullpath)
      /**
       * 要再检查一下目录是否存在
       * 防止调用 dirCallback 时，目录被删除
       */
      if (fs.existsSync(fullpath)) {
        preOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      }
      continue
    }
    /**
     * 目录下的文件
     */
    fileCallback(fullpath)
  }
}

/**
 * 递归处理目录和文件
 * fs.readdirSync：同步读取目录内容
 * 拼接为绝对路径
 *
 * fs.lstatSync 同步获取路径引用的符号链接。Stats 对象
 *
 * isDirectory() 如果是目录，返回 true
 *
 * 深度优先遍历（文件优先，目录其次）
 * 1. 先删除最深层目录下的所有文件，再删除该目录
 */
export function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename)
    // 目录
    if (fs.lstatSync(fullpath).isDirectory()) {
      // 先遍历 fullpath
      // 再把目录的路径返回给回调函数
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      dirCallback(fullpath)
      continue
    }
    // 文件
    fileCallback(fullpath)
  }
}

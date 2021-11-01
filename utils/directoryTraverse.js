import fs from 'fs'
import path from 'path'

export function preOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename)
    if (fs.lstatSync(fullpath).isDirectory()) {
      dirCallback(fullpath)
      // in case the dirCallback removes the directory entirely
      if (fs.existsSync(fullpath)) {
        preOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      }
      continue
    }
    fileCallback(fullpath)
  }
}

/**
 * 递归处理目录或文件
 * fs.readdirSync：同步读取目录内容
 * 拼接成完全的绝对目录路径或完整的绝对文件路径
 * 
 * fs.lstatSync 同步获取路径引用的符号链接。Stats 对象
 * 
 * isDirectory() 如果是目录，返回 true
 * 
 * 深度优先遍历
 */
export function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    const fullpath = path.resolve(dir, filename)
    // 目录
    if (fs.lstatSync(fullpath).isDirectory()) {
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      dirCallback(fullpath)
      continue
    }
    // 文件
    fileCallback(fullpath)
  }
}

/**
 * 安装包
 *   npm：npm install
 *   yarn: yarn 
 * 
 * 运行脚本
 *   npm run xxx
 *   yarn xxx
 *   pnpm xxx
 */
export default function getCommand(packageManager, scriptName) {
  if (scriptName === 'install') {
    return packageManager === 'yarn' ? 'yarn' : `${packageManager} install`
  }

  return packageManager === 'npm' ? `npm run ${scriptName}` : `${packageManager} ${scriptName}`
}

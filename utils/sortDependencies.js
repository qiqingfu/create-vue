/**
 * 对 package.json 的字段进行排序
 * 1. 对 dependencies、devDependencies、peerDependencies 和 optionalDependencies 对象的包名称进行
 * 默认的 sort 排序
 * 2. 将
 * @param packageJson
 * @returns {*}
 */
export default function sortDependencies(packageJson) {
  const sorted = {}

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

  for (const depType of depTypes) {
    /**
     * package.json 对象中如果存在 depTypes 中的某个属性
     */
    if (packageJson[depType]) {
      sorted[depType] = {}

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {
          sorted[depType][name] = packageJson[depType][name]
        })
    }
  }

  return {
    ...packageJson,
    ...sorted
  }
}

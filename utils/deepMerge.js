/**
 * 校验是不是对象
 * @param val
 * @returns {boolean}
 */
const isObject = (val) => val && typeof val === 'object'
/**
 * 对两个数组进行数组去重，使用 Set 集合
 * @param a
 * @param b
 * @returns {*}
 */
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))

/**
 * 递归地将新对象的内容合并到现有对象中，新的属性会覆盖旧的属性
 * Recursively merge the content of the new object to the existing one
 * @param {Object} target the existing object
 * @param {Object} obj the new object
 *
 * Example:
 *   const user1 = {name: 'jack', age: 22, links: {a: 1, b: 2}}
 *   const user2 = {name: 'tony', links: {a: 3, c: 4}}
 *
 *   deepMerge(user1, user2)
 *   { age: 22, links: {a: 3, b: 2, c: 4}, name: "tony"}
 */
function deepMerge(target, obj) {
  /**
   * for (const key of Object.keys(obj) ) {}
   */
  for (const key of Object.keys(obj)) {
    const oldVal = target[key]
    const newVal = obj[key]

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal)
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(oldVal, newVal)
    } else {
      target[key] = newVal
    }
  }

  return target
}

export default deepMerge

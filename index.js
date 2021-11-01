#!/usr/bin/env node
// @ts-check

/**
 * Node 内置的模块
 */
import fs from 'fs'
import path from 'path'

/**
 * 用于解析命令行参数
 */
import minimist from 'minimist'
/**
 * 交互式命令行，包括列表选择，Input输入，单选，多选等...
 */
import prompts from 'prompts'
/**
 * 命令行颜色工具
 */
import { red, green, bold } from 'kolorist'

import renderTemplate from './utils/renderTemplate.js'
import { postOrderDirectoryTraverse, preOrderDirectoryTraverse } from './utils/directoryTraverse.js'
import generateReadme from './utils/generateReadme.js'
import getCommand from './utils/getCommand.js'

/**
 * 检查 package.json 的 name 是否有效
 * @param {any} projectName 
 */
function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

/**
 * 转换为标准的有效的包名
 * @param {*} projectName 
 */
function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

/**
 * 用于检查此覆盖操作是否安全
 * 若目录不存在或者是空目录，则覆盖是安全的，无需提示
 * 否则覆盖是不安全的，需要提示用户
 * @param {String} dir 
 */
function canSafelyOverwrite(dir) {
  return !fs.existsSync(dir) || fs.readdirSync(dir).length === 0
}

/**
 * 删除一个目录及其内部的所有文件 
 */
function emptyDir(dir) {
  postOrderDirectoryTraverse(
    dir,
    // 目录删除
    (dir) => fs.rmdirSync(dir),
    // 删除文件或符号链接
    (file) => fs.unlinkSync(file)
  )
}

async function init() {
  /**
   * Node 进行的当前工作目录
   */
  const cwd = process.cwd()
  /**
   * 命令行接受的参数
   */
  // possible options:
  // --default
  // --typescript / --ts
  // --jsx
  // --router / --vue-router
  // --vuex
  // --with-tests / --tests / --cypress
  // --force (for force overwriting)
  /**
   * minimist 第二个参数接受选项对象
   *  alias 设置字符串名称映射的别名
   */
  const argv = minimist(process.argv.slice(2), {
    alias: {
      typescript: ['ts'],
      'with-tests': ['tests', 'cypress'],
      router: ['vue-router']
    },
    // all arguments are treated as booleans
    boolean: true
  })

  // if any of the feature flags is set, we would skip the feature prompts
  // use `??` instead of `||` once we drop Node.js 12 support
  const isFeatureFlagsUsed =
    typeof (argv.default || argv.ts || argv.jsx || argv.router || argv.vuex || argv.tests) ===
    'boolean'

    /**
     * npx create-vue ./demo
     * 设置项目生成的目录，如果没有设置，则使用默认的项目名称
     */
  let targetDir = argv._[0]
  const defaultProjectName = !targetDir ? 'vue-project' : targetDir

  /**
   * 已有生成的目录，是否强行覆盖
   */
  const forceOverwrite = argv.force

  let result = {}

  try {
    // Prompts:
    // - Project name:
    // - whether to overwrite the existing directory or not?
    // - enter a valid package name for package.json
    // - Project language: JavaScript / TypeScript
    // - Add JSX Support?
    // - Install Vue Router for SPA development?
    // - Install Vuex for state management? (TODO)
    // - Add Cypress for testing?
    result = await prompts(
      [
        /**
         * 项目名称, 当 type 为 null 时则跳过该询问.
         * onState，当前提示的状态改变时的回调  state => TODO
         * state: { value: xxx, aborted: boolean }
         */
        {
          name: 'projectName',
          type: targetDir ? null : 'text',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
        },
        /**
         * 检查是否应该覆盖
         * 1. canSafelyOverwrite 可以安全覆盖
         * 2. forceOverwrite 强制覆盖，因此不提示
         */
        {
          name: 'shouldOverwrite',
          type: () => (canSafelyOverwrite(targetDir) || forceOverwrite ? null : 'confirm'),
          message: () => {
            const dirForPrompt =
              targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`

            return `${dirForPrompt} is not empty. Remove existing files and continue?`
          }
        },
        /**
         * 覆盖检查，当 shouldOverwrite confirm 确认时，用户选择 N 拒绝时，
         * 则触发 overwriteChecker
         */
        {
          name: 'overwriteChecker',
          type: (prev, values = {}) => {
            if (values.shouldOverwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled')
            }
            return null
          }
        },
        /**
         * 包的名称，目录名作为 package.json 的 name
         * validate 接收用户的输入进行校验，有效值返回 true，否则返回字符串类型的错误消息
         */
        {
          name: 'packageName',
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          message: 'Package name:',
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name'
        },
        {
          name: 'needsTypeScript',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: 'Add TypeScript?',
          initial: false,
          active: 'Yes',
          inactive: 'No'
        },
        {
          name: 'needsJsx',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: 'Add JSX Support?',
          initial: false,
          active: 'Yes',
          inactive: 'No'
        },
        {
          name: 'needsRouter',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: 'Add Vue Router for Single Page Application development?',
          initial: false,
          active: 'Yes',
          inactive: 'No'
        },
        {
          name: 'needsVuex',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: 'Add Vuex for state management?',
          initial: false,
          active: 'Yes',
          inactive: 'No'
        },
        {
          name: 'needsTests',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: 'Add Cypress for testing?',
          initial: false,
          active: 'Yes',
          inactive: 'No'
        }
      ],
      /**
       * 当用户取消操作时，抛出错误，让外部 catch 捕获
       */
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  // `initial` won't take effect if the prompt type is null
  // so we still have to assign the default values here
  const {
    packageName = toValidPackageName(defaultProjectName),
    shouldOverwrite,
    needsJsx = argv.jsx,
    needsTypeScript = argv.typescript,
    needsRouter = argv.router,
    needsVuex = argv.vuex,
    needsTests = argv.tests
  } = result

  /**
   * 项目目录的路径
   */
  const root = path.join(cwd, targetDir)

  /**
   * 覆盖已有的项目
   */
  if (shouldOverwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    /**
     * 当前目录不存在，使用 mkdirSync
     * 这创建完成之后，就可以向该目录中写入内容了
     */
    fs.mkdirSync(root)
  }

  console.log(`\nScaffolding project in ${root}...`)

  /**
   * 创建 package.json 的初始信息
   *  - 包名
   *  - 版本号
   */
  const pkg = { name: packageName, version: '0.0.0' }
  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(pkg, null, 2))

  // todo:
  // work around the esbuild issue that `import.meta.url` cannot be correctly transpiled
  // when bundling for node and the format is cjs
  // const templateRoot = new URL('./template', import.meta.url).pathname
  /**
   * 模板根目录
   */
  const templateRoot = path.resolve(__dirname, 'template')
  /**
   * 统一的 render 函数，使用根模板目录下的指定部分
   * 然后由 renderTemplate 函数向 root 目录添加
   */
  const render = function render(templateName) {
    const templateDir = path.resolve(templateRoot, templateName)
    renderTemplate(templateDir, root)
  }

  // 呈现基本的模板
  render('base')

  // Add configs.
  if (needsJsx) {
    render('config/jsx')
  }
  if (needsRouter) {
    render('config/router')
  }
  if (needsVuex) {
    render('config/vuex')
  }
  if (needsTests) {
    render('config/cypress')
  }
  if (needsTypeScript) {
    render('config/typescript')
  }

  // Render code template.
  // prettier-ignore
  const codeTemplate =
    (needsTypeScript ? 'typescript-' : '') +
    (needsRouter ? 'router' : 'default')
  render(`code/${codeTemplate}`)

  // Render entry file (main.js/ts).
  if (needsVuex && needsRouter) {
    render('entry/vuex-and-router')
  } else if (needsVuex) {
    render('entry/vuex')
  } else if (needsRouter) {
    render('entry/router')
  } else {
    render('entry/default')
  }

  // Cleanup.

  if (needsTypeScript) {
    // rename all `.js` files to `.ts`
    // rename jsconfig.json to tsconfig.json
    preOrderDirectoryTraverse(
      root,
      () => {},
      (filepath) => {
        if (filepath.endsWith('.js')) {
          fs.renameSync(filepath, filepath.replace(/\.js$/, '.ts'))
        } else if (path.basename(filepath) === 'jsconfig.json') {
          fs.renameSync(filepath, filepath.replace(/jsconfig\.json$/, 'tsconfig.json'))
        }
      }
    )

    // Rename entry in `index.html`
    const indexHtmlPath = path.resolve(root, 'index.html')
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8')
    fs.writeFileSync(indexHtmlPath, indexHtmlContent.replace('src/main.js', 'src/main.ts'))
  }

  if (!needsTests) {
    // All templates assumes the need of tests.
    // If the user doesn't need it:
    // rm -rf cypress **/__tests__/
    preOrderDirectoryTraverse(
      root,
      (dirpath) => {
        const dirname = path.basename(dirpath)

        if (dirname === 'cypress' || dirname === '__tests__') {
          emptyDir(dirpath)
          fs.rmdirSync(dirpath)
        }
      },
      () => {}
    )
  }

  // Instructions:
  // Supported package managers: pnpm > yarn > npm
  // Note: until <https://github.com/pnpm/pnpm/issues/3505> is resolved,
  // it is not possible to tell if the command is called by `pnpm init`.
  const packageManager = /pnpm/.test(process.env.npm_execpath)
    ? 'pnpm'
    : /yarn/.test(process.env.npm_execpath)
    ? 'yarn'
    : 'npm'

  // README generation
  fs.writeFileSync(
    path.resolve(root, 'README.md'),
    generateReadme({
      projectName: result.projectName || defaultProjectName,
      packageManager,
      needsTypeScript,
      needsTests
    })
  )

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  ${bold(green(`cd ${path.relative(cwd, root)}`))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log()
}

init().catch((e) => {
  console.error(e)
})

// Copyright 2022 dinospring.cn
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { execSync } from 'child_process'
import { execa } from 'execa'
import fs from 'fs'
import open from 'open'
import path from 'path'
import pc from 'picocolors'

import { ProjectConfig } from '../types'




export const checkConfig = (dir: string = './'): ProjectConfig =>{
  const filePath = path.join(dir, '.dino-proj.json')
  if (!fs.existsSync(filePath)) {
    console.log(pc.red('Error: ') + '.dino-proj.json not found')
    return undefined
  }
  try {
    var configFile = JSON.parse(fs.readFileSync(filePath).toString()) as ProjectConfig
    return {
      name: configFile.name,
      srcPath: configFile.srcPath ?? path.join('src', 'main', 'java'),
      package: configFile.package,
      author: configFile.author,
      modulesPackage: configFile.modulesPackage ?? 'modules',
      sysPackage: configFile.sysPackage ?? 'sys',
      tablePrefix: configFile.tablePrefix ?? 't',
    }
  } catch (e) {
    console.log(pc.red('Error: ') , '.dino-proj.json has error ' , pc.red(e.message))
  }
}

// https://github.com/sindresorhus/open#app
const OSX_CHROME = 'google chrome'

const Actions = {
  NONE: 0,
  BROWSER: 1,
  SCRIPT: 2,
}

function getBrowserEnv() {
  // Attempt to honor this environment variable.
  // It is specific to the operating system.
  // See https://github.com/sindresorhus/open#app for documentation.
  const value = process.env.BROWSER
  let action
  if (!value) {
    // Default.
    action = Actions.BROWSER
  } else if (value.toLowerCase().endsWith('.js')) {
    action = Actions.SCRIPT
  } else if (value.toLowerCase() === 'none') {
    action = Actions.NONE
  } else {
    action = Actions.BROWSER
  }
  return { action, value }
}

function executeNodeScript(scriptPath, url) {
  const extraArgs = process.argv.slice(2)
  const child = execa('node', [scriptPath, ...extraArgs, url], {
    stdio: 'inherit',
  })
  child.on('close', (code) => {
    if (code !== 0) {
      console.log()
      console.log(pc.red('The script specified as BROWSER environment variable failed.'))
      console.log(pc.cyan(scriptPath), ' exited with code ' + code + '.')
      console.log()
    }
  })
  return true
}

function startBrowserProcess(browser, url) {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // Chrome with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript = process.platform === 'darwin' && (typeof browser !== 'string' || browser === OSX_CHROME)

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      // Try our best to reuse existing tab
      // on OS X Google Chrome with AppleScript
      execSync('ps cax | grep "Google Chrome"')
      execSync('osascript openChrome.applescript "' + encodeURI(url) + '"', {
        cwd: __dirname,
        stdio: 'ignore',
      })
      return true
    } catch (err) {
      // Ignore errors.
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing the string `open` to `open` function (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined
  }

  // Fallback to open
  // (It will always open new tab)
    const options = { app: { name: browser }, url: true }
    open(url, options).catch(() => {}) // Prevent `unhandledRejection` error.
    return true

}

/**
 * Reads the BROWSER environment variable and decides what to do with it. Returns
 * true if it opened a browser or ran a node.js script, otherwise false.
 */
export const openBrowser = (url) => {
  const { action, value } = getBrowserEnv()
  switch (action) {
    case Actions.NONE:
      // Special case: BROWSER="none" will prevent opening completely.
      return false
    case Actions.SCRIPT:
      return executeNodeScript(value, url)
    case Actions.BROWSER:
      return startBrowserProcess(value, url)
    default:
      throw new Error('Not implemented.')
  }
}

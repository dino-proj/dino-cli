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
import fs from 'fs'
import { endsWith, isNil } from 'lodash-es'
import path from 'path'
import pc from 'picocolors'

import config from '@/utils/config'

import { loadProjConfig } from '../utils'
import { codeGenSpring } from './codeGen'

const code = (moduleNames: string[], force: boolean = false) => {
  const workDir = process.cwd()
  const confDir = config.confDir(workDir)
  const moduleDir = config.modulesDir(workDir)

  // check conf dir
  if (!fs.existsSync(confDir)) {
    console.log(pc.red('Error: ') + '.dino-dev directory not found in ' + workDir)
    process.exit(1)
  }

  // check modules dir
  if (!fs.existsSync(moduleDir)) {
    console.log(pc.red('Error: ') + 'modules directory not found in ' + confDir)
    process.exit(1)
  }

  const proj = loadProjConfig(confDir)
  if (isNil(proj)) {
    console.log(pc.red('Exit'))
    process.exit(1)
  }

  const moduleList = fs
    .readdirSync(moduleDir)
    .filter((p) => endsWith(p, '.json'))
    .map((p) => p.substring(0, p.length - 5))

  if (moduleNames.includes('*')) {
    moduleNames = moduleList
  } else {
    moduleNames.forEach((m) => {
      if (!moduleList.includes(m)) {
        console.log(pc.red('Error: ') + 'module not found', pc.green(m), 'in', moduleList)
        process.exit(1)
      }
    })
  }

  console.log(pc.cyan('start gen'), pc.green(proj.type), 'code with template', proj.templateName)

  moduleNames.forEach((m) => {
    codeGenSpring(confDir, proj, JSON.parse(fs.readFileSync(path.join(moduleDir, m + '.json')).toString()), force)
  })
}

export default code

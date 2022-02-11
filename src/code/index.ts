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
import { isNil } from 'lodash-es'
import pc from 'picocolors'

import { checkConfig } from '../utils'
import { codeGenSpring } from './codeGen'

const code = (type: string, files: string[], force: boolean = false) => {
  console.log(pc.cyan('start gen'), pc.green(type), 'code...')

  const proj = checkConfig(process.cwd())
  if (isNil(proj)) {
    console.log(pc.red('Exit'))
    process.exit(1)
  }
  files.forEach((moduleFile) => {
    codeGenSpring(proj, JSON.parse(fs.readFileSync(moduleFile).toString()), force)
  })
}

export default code

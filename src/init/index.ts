// Copyright 2023 dinospring.cn
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

import pc from 'picocolors'
import fs from 'fs'

import config from '@/utils/config'

const init = () => {
  const workDir = process.cwd()
  if (fs.existsSync(config.confFilePath(workDir))) {
    console.log(pc.bgYellow('Warn:'), 'already initialized at:', pc.green(workDir))
    process.exit(0)
  }
  console.log('init dino project at: ', pc.green(workDir))
}

export default init

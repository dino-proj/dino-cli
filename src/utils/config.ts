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

import path from 'path'

const confDirName = '.dino-dev'

const confFileName = '.dino-proj.json'

const modulesDirName = 'modules'

const confDir = (workDir: string = null) => {
  return path.join(workDir ?? process.cwd(), confDirName)
}

const confFilePath = (workDir: string = null) => {
  return path.join(confDir(workDir), confFileName)
}

const modulesDir = (workDir: string = null) => {
  return path.join(confDir(workDir), modulesDirName)
}

export default {
  confDirName,
  confDir,
  confFileName,
  confFilePath,
  modulesDirName,
  modulesDir,
}

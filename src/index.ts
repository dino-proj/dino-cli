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
import { program } from 'commander'
import pc from 'picocolors'

import agent from './agent'
import code from './code'
import { genProject } from './create'

program //
  .name('dino') //
  .version(`@dino/cli ${require('../package').version}`) //
  .usage('<command> [options]')

program //
  .command('cloud') //
  .description('start the agent and open the dino cloud ui') //
  .action(() => {
    console.log('checking project config')
    agent()
  })

program //
  .command('create') //
  .addArgument(program.createArgument('<what>', 'Project type spring|vue3').choices(['spring', 'vue3']))
  .argument('<project-name>', 'The name of project ')
  .option('-t, --template <template-name>', 'The project template to use. ex: dino-framework@1.0.0', 'dino-framework')
  .option('-f, --force', 'Overwrite target directory if it exists', false)
  .option('-n, --no-git', 'Skip git initialization', false)
  .description('create a spring/vue3 project') //
  .action((what: 'spring' | 'vue3', projectName: string, options: { template: string; force: boolean; noGit: boolean }) => {
    genProject(what, projectName)
  })

program //
  .command('code') //
  .argument('<module...>', "Module names. '*' for all")
  .option('-f, --force', 'Overwrite the target file if it exists', false)
  .description('generate "spring" or "vue3" code from schema') //
  .action((modules: string[], options: { force: boolean }) => {
    code(modules, options.force)
  })

// output help information on unknown commands
program.on('command:*', ([cmd]) => {
  program.outputHelp()
  console.log(`  ` + pc.red(`Unknown command ${pc.yellow(cmd)}.`))
  console.log()
  process.exitCode = 1
})

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run dino <command> --help for detailed usage of given command.`)
  console.log()
})

program.parse(process.argv)

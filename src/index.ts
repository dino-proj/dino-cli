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
import chalk from 'chalk'
import { Argument, program } from 'commander'

import agent from './agent'
import code from './code'

program //
  .name('dino') //
  .version(`@dino/cli ${require('../package').version}`) //
  .usage('<command> [options]')

program //
  .command('agent') //
  .description('start the agent and open the dino cloud ui') //
  .action(() => {
    console.log('agent')
    agent()
  })

program //
  .command('code') //
  .addArgument(new Argument('<type>', '"spring" or "vue" code').choices(['spring','vue']))
  .argument('<schema-file...>', 'module schema file')
  .option('-f, --force', 'force overwrite the exists file', false)
  .description('generate "spring" or "vue" code from schema') //
  .action((type: string, files: string[], options: {force:boolean}) => {
    code(type,files, options.force)
  })

// output help information on unknown commands
program.on('command:*', ([cmd]) => {
  program.outputHelp()
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
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

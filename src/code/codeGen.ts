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
import dayjs from 'dayjs'
import fs from 'fs'
import {
  camelCase,
  endsWith,
  extend,
  get,
  has,
  isArray,
  isNil,
  join,
  snakeCase,
  startsWith,
  trim,
  trimEnd,
  trimStart,
  upperFirst,
} from 'lodash-es'
import path from 'path'
import pc from 'picocolors'
import Template7 from 'template7'
import yesno from 'yesno'

import { ClassTypes, defaultBase, ModuleCodeSchema, ModuleSchema, ProjectConfig } from '../types'

type Render = (ctx: Record<string, any>) => string

const loadTemplate = (templName: string): Map<string, Render> => {
  const tmplDir = path.join(process.cwd(), templName)
  const templMap = new Map<string, Render>()
  const templeFiles = fs.readdirSync(tmplDir).filter((name) => endsWith(name, '.tmpl'))
  templeFiles.forEach((templ) => {
    console.log('  Load template:', pc.green(templ))
    templMap.set(trimEnd(templ, '.tmpl'), Template7.compile(fs.readFileSync(path.join(tmplDir, templ)).toString()))
  })
  console.log(pc.bold(pc.green(templMap.size)), 'template(s) loaded!\n')
  return templMap
}
const javaPrimerys = new Set(['Boolean', 'boolean', 'Double', 'double', 'Float', 'float', 'Integer', 'int', 'Long', 'long', 'Short', 'short', 'String'])
const initTeplateEngine = () => {
  Template7.registerHelper('cap', upperFirst)
  Template7.registerHelper('snake', snakeCase)
  Template7.registerHelper('camel', camelCase)
  Template7.registerHelper('lower', (str:string) => (isNil(str) ? str : str.toLowerCase()))
  Template7.registerHelper('colDef', (propType: string) => {
    if (javaPrimerys.has(propType)) {
      return ''
    } else {
      return ', columnDefinition = "jsonb"'
    }
  })
  Template7.registerHelper('extends', (exp: string | string[], clazz: Record<ClassTypes, string>) => {
    const expArr = asArray(exp)
    const ifs = expArr.filter((v) => startsWith(v, '-')).map((v) => genClassName(v, clazz))
    const clzs = expArr.filter((v) => !startsWith(v, '-') && v.length > 0).map((v) => genClassName(v, clazz))
    let result = ''
    if (clzs.length > 0) {
      result = ` extends ${join(clzs, ', ')}`
    }
    if (ifs.length > 0) {
      result = result + ` implements ${join(ifs, ', ')}`
    }
    return result
  })
}

const asArray = <T>(val: T | T[]): T[] => {
  if (isNil(val)) {
    return []
  }
  if (isArray(val)) {
    return val
  }
  return [val]
}

const genClassName = (name: string, clzz: Record<ClassTypes, string>): string => {
  name = trim(trimStart(name, '-'))
  if (endsWith(name, '>')) {
    return name.replaceAll(/\$([a-zA-Z])+/g, (arg: string): string => {
      arg = trimStart(arg, '$')
      if (has(clzz, arg)) {
        return get(clzz, arg)
      }
    })
  }
  return name
}

const getClassNames = (mod: string): Record<ClassTypes, string> => {
  mod = upperFirst(mod)
  return {
    entity: `${mod}Entity`,
    vo: `${mod}Vo`,
    service: `${mod}Service`,
    dao: `${mod}Repository`,
    req: `${mod}Req`,
    controller: `${mod}Controller`,
    search: `${mod}Search`,
  }
}

const genSchema = (mod: ModuleSchema): ModuleCodeSchema => {
  const searchProps = mod.props.filter((prop) => !isNil(prop.search))
  const voProps = mod.props.filter((prop) => prop.vo !== false)
  const entityProps = mod.props.filter((prop) => prop.entity !== false)
  const reqProps = mod.props.filter((prop) => prop.req !== false)

  mod.base = extend({}, defaultBase, mod.base)
  return {
    ...mod,
    hasSearch: searchProps.length > 0,
    hasVo: voProps.length > 0,
    searchProps,
    voProps,
    entityProps,
    reqProps,
  }
}

export const codeGenSpring = (config: ProjectConfig, module: ModuleSchema | ModuleSchema[], force: boolean = false): boolean => {
  initTeplateEngine()
  const templMap = loadTemplate('templ')

  asArray(module).forEach((mod) => {
    console.log(pc.bold(pc.green('Module: ')), pc.green(mod.name))
    const packagePath = path.join(config.srcPath, ...config.package.split('.'), ...config.modulesPackage?.split('.'), mod.name.toLowerCase())
    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true })
    }

    templMap.forEach((value, key) => {
      const file = path.join(packagePath, `${upperFirst(mod.name)}${upperFirst(key)}.java`)
      const code = value({
        config,
        schema: genSchema(mod),
        context: {
          now: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
          clazz: { key: mod.key, ...getClassNames(mod.name) },
        },
      })

      if (!force && fs.existsSync(file)) {
        yesno({
          question: pc.bold(`  ${upperFirst(mod.name)}${upperFirst(key)}.java exists, ${pc.red('Overwrite?')}`),
          defaultValue: false,
        }).then((yes) => {
          if (yes) {
            fs.writeFileSync(file, code, { encoding: 'utf-8', flag: 'w' })
            console.log(pc.green(`  Gen: ${upperFirst(key)}`), 'into', pc.cyan(file))
          } else {
            console.log(pc.yellow(`  Skip: ${upperFirst(key)}`), 'exists', pc.cyan(`${upperFirst(mod.name)}${upperFirst(key)}.java`))
          }
        })
      } else {
        fs.writeFileSync(file, code, { encoding: 'utf-8', flag: 'w' })
        console.log(pc.green(`  Gen: ${upperFirst(key)}`), 'into', pc.cyan(file))
      }
    })
  })
  return true
}

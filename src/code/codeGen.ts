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
import promiseUtils from 'blend-promise-utils'
import dayjs from 'dayjs'
import fs from 'fs'
import { camelCase, endsWith, extend, get, has, isArray, isEmpty, isNil, join, snakeCase, startsWith, trim, trimStart, upperFirst } from 'lodash-es'
import path from 'path'
import pc from 'picocolors'
import Template7 from 'template7'
import yesno from 'yesno'

import { ClassTypes, defaultBase, ModuleCodeSchema, ModuleSchema, ProjectConfig, Prop } from '../types'

type Render = (ctx: Record<string, any>) => string

const loadTemplate = (workdir: string, templName: string): Array<{ name: string; render: Render }> => {
  const tmplDir = path.join(workdir, templName)
  const templMap = []
  const templeFiles = fs.readdirSync(tmplDir).filter((name) => endsWith(name, '.tmpl'))
  templeFiles.forEach((templ) => {
    console.log('  Load template:', pc.green(templ))
    templMap.push({ name: templ.substring(0, templ.length - 5), render: Template7.compile(fs.readFileSync(path.join(tmplDir, templ)).toString()) })
  })
  console.log(pc.bold(pc.green(templMap.length)), 'template(s) loaded!\n')
  return templMap
}
const javaPrimerys = new Set(['Boolean', 'boolean', 'Double', 'double', 'Float', 'float', 'Integer', 'int', 'Long', 'long', 'Short', 'short', 'String', 'Date'])
const initTeplateEngine = () => {
  Template7.registerHelper('cap', upperFirst)
  Template7.registerHelper('snake', snakeCase)
  Template7.registerHelper('camel', camelCase)
  Template7.registerHelper('lower', (str: string) => (isNil(str) ? str : str.toLowerCase()))
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

  Template7.registerHelper('javaImport', (propsArr: Array<Prop[]>) => {
    const props: Prop[] = propsArr.flat()
    return props
      .filter((p) => !isNil(p.imports))
      .map((p) => `import ${p.imports[0]};`)
      .join('\n')
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

const dealProp = (config: ProjectConfig, prop: Prop) => {
  if (prop.type.indexOf('.') > 0) {
    let importClass = prop.type.indexOf('<') > 0 ? prop.type.substring(0, prop.type.indexOf('<')) : prop.type

    if (importClass.startsWith('@')) {
      importClass = config.package + '.' + config.modulesPackage + '.' + importClass.substring(1)
    }
    prop.imports = [importClass]
    prop.type = prop.type.substring(prop.type.lastIndexOf('.') + 1)
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

export const codeGenSpring = (confDir: string, config: ProjectConfig, module: ModuleSchema | ModuleSchema[], force: boolean = false): boolean => {
  initTeplateEngine()
  const templMap = loadTemplate(confDir, config.templateName)

  asArray(module).forEach((mod) => {
    mod.props.forEach((p) => dealProp(config, p))
    console.log(pc.bold(pc.green('Module: ')), pc.green(mod.name))
    const paths = [config.srcPath, ...config.package.split('.'), ...(config.modulesPackage || '').split('.'), mod.name.toLowerCase()]
    const packagePath = path.join(...paths.filter((p) => !isEmpty(p)))
    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true })
    }

    promiseUtils.mapSeries(templMap, async (templ) => {
      const file = path.join(packagePath, `${upperFirst(mod.name)}${upperFirst(templ.name)}.java`)
      const code = templ.render({
        config,
        schema: genSchema(mod),
        context: {
          now: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
          clazz: { key: mod.key, ...getClassNames(mod.name) },
        },
      })

      await writeCode(mod.name, templ.name, code, file, force)
    })
  })
  return true
}

const writeCode = async (modName: string, templateName: string, code: string, filePath: string, force: boolean) => {
  if (!force && fs.existsSync(filePath)) {
    const yes = await yesno({
      question: pc.bold(`  ${upperFirst(modName)}${upperFirst(templateName)}.java exists, ${pc.red('Overwrite?')}`),
      defaultValue: false,
    })
    if (yes) {
      fs.writeFileSync(filePath, code, { encoding: 'utf-8', flag: 'w' })
      console.log(pc.green(`  Gen: ${upperFirst(templateName)}`), 'into', pc.cyan(filePath))
    } else {
      console.log(pc.yellow(`  Skip: ${upperFirst(templateName)}`), 'exists', pc.cyan(`${upperFirst(modName)}${upperFirst(templateName)}.java`))
    }
  } else {
    fs.writeFileSync(filePath, code, { encoding: 'utf-8', flag: 'w' })
    console.log(pc.green(`  Gen: ${upperFirst(templateName)}`), 'into', pc.cyan(filePath))
  }
}

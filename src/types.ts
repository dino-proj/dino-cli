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

export interface ProjectConfig {
  name: string
  srcPath: string
  type: 'spring' | 'vue'
  author?: {
    name: string
    email?: string
  }
  tablePrefix?: string
  package: string
  templateName: string
  modulesPackage?: string
  sysPackage?: string
}

export interface Prop {
  name: string
  title: string
  type: string
  size?: number
  nullable?: boolean
  update?: boolean
  entity?: boolean
  vo?: boolean
  req?: boolean
  search?: 'eq' | 'like' | 'in'
  imports?: string[]
}

export type ClassTypes = 'entity' | 'vo' | 'service' | 'dao' | 'req' | 'controller' | 'search'
type BaseType = Record<ClassTypes, string | string[]>
export const defaultBase: BaseType = {
  entity: 'EntityBase<$key>',
  vo: 'VoImplBase<$key>',
  service: 'ServiceBase<$entity, $key>',
  dao: 'CrudRepositoryBase<$entity, $key>',
  controller: '-CrudControllerBase<$service, $entity, $vo, $search, $req, $key>',
  search: '-CustomQuery',
  req: '',
}

export interface ModuleSchema {
  name: string
  package?: string
  type: 'domain' | 'record'
  title: string
  key: 'Long' | 'String'
  tenantable?: boolean
  logicalDelete?: boolean
  base?: BaseType
  props: Prop[]
}

export type ModuleCodeSchema = ModuleSchema & {
  hasSearch: boolean
  hasVo: boolean
  entityProps: Prop[]
  voProps: Prop[]
  searchProps: Prop[]
  reqProps: Prop[]
}

export interface ClassDef {
  type: 'interface' | 'enum' | 'class'
  name: string
  package: string
  imports?: string | string[]
  dependencies?: string | string[]
}
export interface FrameConfig {
  name: string
  version: string
  description: string
  author: string
  classDefs: ClassDef[]
  baseClass: {
    [key in ClassTypes]?: string[]
  }
}

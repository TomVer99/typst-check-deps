import fs from 'node:fs'
import fsp from 'node:fs/promises'
// import path from 'node:path'
import * as core from '@actions/core'
import TOML from 'smol-toml'
import { PackageInfo } from './common.js'
import path from 'node:path'

const workspace = process.env.GITHUB_WORKSPACE || '.'

enum RepoType {
  PACKAGE,
  // MAIN_IN_ROOT,
  // COMPOSITE,
  USER_DEFINED,
  UNDEFINED
}

export async function retrievePackageDependencies(): Promise<PackageInfo[]> {
  const projectType = await detectProjectType()

  let pkgs: PackageInfo[] = []

  if (projectType == RepoType.PACKAGE) {
    const libMainFilePath = await parseTOMLForLibFilePath(
      workspace + '/typst.toml'
    )
    pkgs = await recursivelyParseFilesForUniverseImports(
      libMainFilePath,
      [],
      workspace
    )
  }

  return pkgs
}

async function recursivelyParseFilesForUniverseImports(
  filePath: string,
  checkedFiles: string[],
  tomlDirPath: string
): Promise<PackageInfo[]> {
  // Make sure we can read from the file
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err === null) {
      fs.access(filePath, fs.constants.R_OK, (read_err) => {
        if (read_err !== null) {
          core.debug('Unable to read file: ' + filePath)
          return []
        }
      })
    }
  })

  // Read contents from the file
  const fileContents = await fsp.readFile(filePath, 'utf8')

  // Get external imports
  const pkgs = await extractPackageImportFromFileContents(
    fileContents,
    filePath.replace(workspace, '')
  )
  // Get other files
  const otherFiles = await extractSubImportsFromFileContents(
    fileContents,
    filePath,
    tomlDirPath
  )
  // We have checked this file, we do not need to check it again
  checkedFiles.push(filePath)

  // For all new imports check if they have already been checked, and if not check them
  for (const file of otherFiles) {
    if (!checkedFiles.includes(file)) {
      pkgs.push(
        ...(await recursivelyParseFilesForUniverseImports(
          file,
          checkedFiles,
          tomlDirPath
        ))
      )
    }
  }

  return pkgs
}

async function extractPackageImportFromFileContents(
  fileContents: string,
  filePath: string
): Promise<PackageInfo[]> {
  // find all lines that import from @preview/... preserving document order
  const re = /^\s*#?\s*import\s+"@preview\/([^"]+)"/gm
  const matches = [...fileContents.matchAll(re)]

  if (matches.length === 0) return []

  // extract the captured group (the package path) and normalize
  const imports = matches.map((m) => String(m[1]).trim())
  const pkgs = []
  for (const element of imports) {
    // Insert info into PackageInfo object, leaving allVersions empty
    const pkgInfo: PackageInfo = {
      name: element.split(':').at(0) ?? '<missing>',
      detectedVersion: element.split(':').at(1) ?? '<missing>',
      allVersions: [],
      detectedInFile: [filePath]
    }
    pkgs.push(pkgInfo)
  }

  return pkgs
}

async function extractSubImportsFromFileContents(
  contents: string,
  filePath: string,
  tomlDirPath: string
): Promise<string[]> {
  const filePaths: string[] = []
  const fileDir = path.dirname(filePath) + '/'
  const lines: string[] = contents.split(/\r?\n/)

  for (const line of lines) {
    if (
      line.includes('import') && // It has to contain an import
      !line.includes('"@preview') && // It cannot be an Universe import
      !line.trim().startsWith('//') // It may not be a comment
    ) {
      const re = /import\s+"([^"]+)"/gm
      const reMatches: string[] = [...line.matchAll(re)].map((m) =>
        String(m[1]).trim()
      )
      for (const match of reMatches) {
        if (match.startsWith('/')) {
          // Relative import to toml file
          const newPath = (tomlDirPath + match.substring(1)).replace('/', '\\')
          if (!filePaths.includes(newPath)) {
            filePaths.push(newPath)
          }
        } else if (match.startsWith('./')) {
          // Relative import to current file
          const newPath = (fileDir + match.replace('./', '')).replace('/', '\\')
          if (!filePaths.includes(newPath)) {
            filePaths.push(newPath)
          }
        } else {
          // Assume its a relative import to current file
          const newPath = (fileDir + match).replace('/', '\\')
          if (!filePaths.includes(newPath)) {
            filePaths.push(newPath)
          }
        }
      }
    }
  }

  return filePaths
}

async function parseTOMLForLibFilePath(tomlFilePath: string): Promise<string> {
  const tomlFileContent = await fsp.readFile(tomlFilePath, 'utf8')
  const parsed = TOML.parse(tomlFileContent)

  let packageToml = '<missing>'

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const pkg = (parsed as Record<string, unknown>)['package']
    if (pkg && typeof pkg === 'object' && !Array.isArray(pkg)) {
      const entry = (pkg as Record<string, unknown>)['entrypoint']
      if (typeof entry === 'string') {
        packageToml = entry
      }
    }
  }

  return workspace + packageToml
}

async function detectProjectType(): Promise<RepoType> {
  const tomlPath = path.join(workspace, '/typst.toml')
  try {
    await fsp.access(tomlPath, fs.constants.R_OK)
    core.debug('typst.toml found and readable, interpreting project as PACKAGE')
    return RepoType.PACKAGE
  } catch (err) {
    core.debug(
      'typst.toml not found or not readable in root dir with error: ' + err
    )
  }

  try {
    const files = await fsp.readdir(workspace)
    const typFiles = files.filter((f) => f.endsWith('.typ'))
    if (typFiles.length > 0) {
      core.debug(
        `Found ${typFiles.length} .typ file(s) in root; treating as USER_DEFINED`
      )
      return RepoType.USER_DEFINED
    }
    core.debug('no .typ files found in root dir')
  } catch (err) {
    core.debug(
      'error reading workspace directory: ' +
      (err instanceof Error ? err.message : String(err))
    )
  }

  return RepoType.UNDEFINED
}

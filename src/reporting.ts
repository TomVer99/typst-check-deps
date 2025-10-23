import { PackageInfo } from './common.js'

export function generateMarkdownTable(pkgs: PackageInfo[]): string {
  const headerList = [
    'File',
    'Package',
    'Detected',
    'Latest',
    'Behind by $n$ versions'
  ]
  let tableString = ''

  // Generate header
  for (const element of headerList) {
    tableString += '|' + element
  }
  tableString += '|\n' + '|-------'.repeat(headerList.length) + '|\n'
  // Generate table contents
  for (const pkg of pkgs) {
    tableString +=
      '|' +
      // Join file array for display
      (Array.isArray(pkg.detectedInFile)
        ? pkg.detectedInFile.join(', ')
        : String(pkg.detectedInFile)) +
      '|' +
      pkg.name +
      '|' +
      pkg.detectedVersion +
      '|' +
      pkg.allVersions.at(0) +
      '|' +
      pkg.allVersions.indexOf(pkg.detectedVersion).toString() +
      '|\n'
  }
  return tableString
}

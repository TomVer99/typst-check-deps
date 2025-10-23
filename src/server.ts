import * as cheerio from 'cheerio'
import * as core from '@actions/core'

export async function getVersionInfo(pkg: string): Promise<[string, string[]]> {
  try {
    const res = await fetch('https://typst.app/universe/package/' + pkg)
    const body = await res.text()
    const dom = cheerio.load(body)

    // Find the current latest version in the banner
    const banner = dom('#banner')
    const version = banner.find('.version')
    if (version.length === 0) {
      core.setFailed('packageNotFound: ' + pkg)
      return ['0.0.0', []]
    }

    // Find the version history table
    const versions = dom('#versions').find('table').find('tbody').find('tr')
    const versionStrings: string[] = versions
      .map((_, el) => dom(el).find('td').first().text().trim())
      .get()

    if (versions.length === 0) {
      core.setFailed('packageNotFound: ' + pkg)
      return ['0.0.0', []]
    }
    if (versionStrings.length === 0) {
      core.setFailed('noPackageVersionTableFound: ' + pkg)
      return ['0.0.0', []]
    }

    // Check if the latest version detected in the banner
    // is the same as the last entry of the version history table
    if (version.text() === versionStrings.at(0)) {
      return [version.text(), versionStrings]
    } else {
      core.setFailed('DOMParseError')
      return ['0.0.0', []]
    }
  } catch (error) {
    if (error instanceof Error) core.debug(error.message)
    return ['0.0.0', []]
  }
}

import * as core from '@actions/core'
import fs from 'node:fs'
import { generateMarkdownTable } from './reporting.js'
import { retrievePackageDependencies } from './parser.js'
import { getVersionInfo } from './server.js'
import { dedupeExact } from './common.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const failOnNewerVersion: boolean = core.getBooleanInput(
      'fail-on-newer-version'
    )
    // Get all dependencies
    const pkgs = await retrievePackageDependencies()

    const pkgs_deduped = dedupeExact(pkgs)

    // Get latest versions for each package
    for (const pkg of pkgs_deduped) {
      ;[, pkg.allVersions] = await getVersionInfo(pkg.name)
    }

    // Generate result table
    const outputTable = generateMarkdownTable(pkgs_deduped)
    core.setOutput('table', outputTable)

    // If the runner provides a GITHUB_STEP_SUMMARY path, append the table
    const summaryPath = process.env.GITHUB_STEP_SUMMARY
    if (summaryPath) {
      fs.appendFileSync(summaryPath, `\n${outputTable}\n`)
    }

    for (const pkg of pkgs_deduped) {
      if (
        pkg.allVersions.indexOf(pkg.detectedVersion) > 0 &&
        failOnNewerVersion
      ) {
        core.setFailed(
          'Newer versions present of ' +
            pkg.name +
            '. In file: ' +
            (Array.isArray(pkg.detectedInFile)
              ? pkg.detectedInFile.join(', ')
              : String(pkg.detectedInFile))
        )
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

import { describe, it, expect } from '@jest/globals'

// Import the runtime JS file for ESM testing. Source is in src/common.ts,
// compiled output when running tests is resolved via ts-jest/ts-node, but
// importing the .js path matches the pattern used in other tests.
const { dedupeExact } = await import('../src/common.js')

describe('common.dedupeExact', () => {
  it('keep entries when all are unique', () => {
    const pkgs = [
      {
        name: 'pkg-a',
        detectedVersion: '1.2.0',
        allVersions: ['1.2.0'],
        detectedInFile: []
      },
      {
        name: 'pkg-b',
        detectedVersion: '1.0.0',
        allVersions: ['1.0.0'],
        detectedInFile: []
      },
      {
        name: 'pkg-c',
        detectedVersion: '2.0.0',
        allVersions: ['2.0.0'],
        detectedInFile: []
      }
    ]

    const out = dedupeExact(pkgs)

    // Expect duplicates removed and original ordering preserved for unique entries
    expect(out).toHaveLength(3)
    expect(out[0].name).toBe('pkg-a')
    expect(out[1].name).toBe('pkg-b')
    expect(out[2].name).toBe('pkg-c')
  })

  it('keep same entries with different version', () => {
    const pkgs = [
      {
        name: 'pkg-a',
        detectedVersion: '1.1.0',
        allVersions: ['1.0.0'],
        detectedInFile: []
      },
      {
        name: 'pkg-a',
        detectedVersion: '1.0.0',
        allVersions: ['1.0.0'],
        detectedInFile: []
      },
      {
        name: 'pkg-b',
        detectedVersion: '2.0.0',
        allVersions: ['2.0.0'],
        detectedInFile: []
      }
    ]

    const out = dedupeExact(pkgs)

    // Expect duplicates removed and original ordering preserved for unique entries
    expect(out).toHaveLength(3)
    expect(out[0].name).toBe('pkg-a')
    expect(out[0].detectedVersion).toBe('1.1.0')
    expect(out[1].name).toBe('pkg-a')
    expect(out[1].detectedVersion).toBe('1.0.0')
    expect(out[2].name).toBe('pkg-b')
  })

  it('combine detected files for same package + version', () => {
    const pkgs = [
      {
        name: 'pkg-a',
        detectedVersion: '1.0.0',
        allVersions: ['1.0.0'],
        detectedInFile: ['fileA']
      },
      {
        name: 'pkg-a',
        detectedVersion: '1.0.0',
        allVersions: ['1.0.0'],
        detectedInFile: ['fileB']
      },
      {
        name: 'pkg-b',
        detectedVersion: '2.0.0',
        allVersions: ['2.0.0'],
        detectedInFile: []
      }
    ]

    const out = dedupeExact(pkgs)

    // Expect duplicates removed and file lists merged into an array
    expect(out).toHaveLength(2)
    expect(out[0].name).toBe('pkg-a')
    // Order of merged files is not guaranteed; check both present
    expect(out[0].detectedInFile).toEqual(
      expect.arrayContaining(['fileA', 'fileB'])
    )
    expect(out[1].name).toBe('pkg-b')
  })

  it('return empty when input is empty', () => {
    const out = dedupeExact([])
    expect(out).toHaveLength(0)
  })
})

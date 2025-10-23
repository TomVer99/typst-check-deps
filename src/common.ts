export interface PackageInfo {
  name: string
  detectedVersion: string
  allVersions: string[]
  detectedInFile: string[]
}

const DELIM = '\u0000'

export function dedupeExact(pkgs: PackageInfo[]): PackageInfo[] {
  const seen = new Map<string, number>()
  const out: PackageInfo[] = []

  const keyFor = (p: PackageInfo) =>
    p.name + DELIM + p.detectedVersion + DELIM + p.allVersions.join(DELIM)

  for (const p of pkgs) {
    const keyNoFile = keyFor(p)

    const existingIdx = seen.get(keyNoFile)
    if (existingIdx === undefined) {
      // Store a shallow copy to avoid mutating the caller's objects.
      seen.set(keyNoFile, out.length)
      // Ensure detectedInFile is an array (defensive copy)
      const files = Array.isArray(p.detectedInFile) ? [...p.detectedInFile] : []
      out.push({ ...p, detectedInFile: files })
      continue
    }

    const existing = out[existingIdx]

    // Merge file arrays into a set to deduplicate
    const set = new Set<string>()
    const addAll = (arr?: string[]) => {
      if (!arr) return
      for (const f of arr) if (f) set.add(f)
    }

    addAll(existing.detectedInFile)
    addAll(p.detectedInFile)

    existing.detectedInFile = Array.from(set)
  }

  return out
}

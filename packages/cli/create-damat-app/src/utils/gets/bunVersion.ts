export function getBunVersion(): number {
  const [majorStr] = Bun.version.split(".")
  const major = parseInt(majorStr ?? "0", 10)

  if (isNaN(major)) {
    throw new Error(`Invalid Bun version format: ${Bun.version}`)
  }

  return major
}

export const MIN_SUPPORTED_BUN_VERSION = 1
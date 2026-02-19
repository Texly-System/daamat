import Configstore from "configstore"

let config: Configstore

export const getConfigStore = (): Configstore => {
  if (!config) {
    config = new Configstore(
      `damat`,
      {},
      {
        globalConfigPath: true,
      }
    )
  }

  return config
}

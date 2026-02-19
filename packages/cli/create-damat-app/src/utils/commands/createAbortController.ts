// Check passed

import ProcessManager from "./manager"

export default (processManager: ProcessManager) => {
  const abortController = new AbortController()
  processManager.onTerminated(() => abortController.abort())
  return abortController
}

export const isAbortError = (e: any) =>
  e !== null && typeof e === "object" && "code" in e && e.code === "ABORT_ERR"

export const getAbortError = () => {
  return {
    code: "ABORT_ERR",
    //TODO: Check the need for those
    message: "Operation cancelled by user",
    signal: "SIGINT",
    status: 130,
  }
}

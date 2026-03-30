import { StageLog } from './types/analysis'

export function createPipelineLogger() {
  const logs: StageLog[] = []

  return {
    start(stage: string) {
      const t = Date.now()
      return {
        success() {
          const duration = Date.now() - t
          logs.push({ stage, status: 'success', duration })
          console.log(
            `[PIPELINE] stage=${stage} duration=${duration}ms status=success`
          )
        },
        error(err: string) {
          const duration = Date.now() - t
          logs.push({ stage, status: 'error', duration, error: err })
          console.error(
            `[PIPELINE] stage=${stage} duration=${duration}ms status=error error=${err}`
          )
        },
      }
    },
    summary() {
      const total = logs.reduce((a, l) => a + l.duration, 0)
      console.log(
        `[PIPELINE] complete total=${total}ms stages=${logs.length}`
      )
      return logs
    },
  }
}

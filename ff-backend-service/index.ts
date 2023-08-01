import server from '@/app'
import * as config from '@/utils/config'
import cleanup from '@/utils/cleanup'
import * as middleware from '@/middlewares/middleware'

async function runServer () {
  // This function deletes the temp directory.
  await cleanup()
  server.listen(config.PORT, () => {
    console.info(`Server running on port ${config.PORT}`)
  })
}

let _log = console.log
console.log = function (...args) {
  return _log(new Date(), ...args)
}

runServer()

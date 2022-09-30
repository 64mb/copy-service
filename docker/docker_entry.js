const { spawn, spawnSync } = require('child_process')

spawnSync('npm ci', {
  stdio: 'inherit',
  shell: true,
})

// install dependencies every time package.json changes
const npmProcess = spawn('nodemon --on-change-only --polling-interval 10000 -L -w package.json --exec "npm ci"', {
  stdio: 'inherit',
  shell: true,
})

const debug = process.env.DEBUG === 'true' ? ' --inspect-brk=0.0.0.0:9229 ' : ''

// restart node when a source file changes, plus
// restart when `npm install` ran based on `package-lock.json` changing
const appProcess = spawn(`nodemon ${debug} --polling-interval 5000 -e js,json`
+ ' -i node_modules -i fs -i package.json -L server.js', {
  stdio: 'inherit',
  shell: true,
})

process.on('SIGTERM', async () => {
  npmProcess.kill('SIGTERM')
  appProcess.kill('SIGTERM')
})

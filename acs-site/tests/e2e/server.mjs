// Starts this project's preview server for a test run.
//
// The server picks a free port and prints it. A fixed port once left the suite
// talking to a stale server from an earlier run and reporting its behaviour as
// ours, so the port is never assumed and the server has to identify itself.
import { spawn } from 'node:child_process';

export async function startServer(root, extraArgs = []) {
  const child = spawn('npx', ['tsx', 'scripts/serve.ts', '--port', '0', ...extraArgs], {
    cwd: root, detached: true, stdio: ['ignore', 'pipe', 'inherit'],
  });
  const stop = () => { try { process.kill(-child.pid); } catch { /* already gone */ } };
  process.on('exit', stop);

  const base = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('preview server did not start')), 30000);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const match = /preview: (http:\/\/127\.0\.0\.1:\d+)\//.exec(buffer);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`preview server exited with code ${code}`)); });
  });

  const probe = await fetch(`${base}/`);
  if (probe.headers.get('x-acs-preview') !== '1') {
    stop();
    throw new Error(`${base} is not this project's preview server`);
  }
  return { base, stop };
}

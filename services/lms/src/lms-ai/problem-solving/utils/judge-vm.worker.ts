import { parentPort, workerData } from 'worker_threads';
import { runVmJudgePayload, type VmJudgePayload } from './judge-vm-inner.util';

if (!parentPort) {
  process.exit(1);
}

const payload = workerData as VmJudgePayload | undefined;
if (!payload) {
  parentPort.postMessage({
    ok: false,
    error: 'Invalid worker payload',
  });
} else {
  parentPort.postMessage(runVmJudgePayload(payload));
}

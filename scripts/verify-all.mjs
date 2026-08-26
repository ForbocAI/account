import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';
import contract from '../data/contracts/verification.json' with { type: 'json' };
import {
    createProcessStageExecutor,
    evaluateStages,
} from './verification/stage-runner.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvironment({
    path: contract.environmentFiles.map((file) => path.join(root, file)),
    override: false,
    quiet: true,
});

const executeStage = createProcessStageExecutor(root, process.env)(
    contract.generatedBoundary,
    contract.statuses,
);

const execute = (stage) => {
    console.log(`\n=== ${stage.label} ===`);
    return executeStage(stage);
};

const summary = evaluateStages(contract.statuses, execute)(contract.stages);
console.log('\n=== Verification summary ===');
summary.results.forEach((result) => {
    console.log(`${result.status === contract.statuses.success ? 'PASS' : 'FAIL'} ${result.id}`);
});
process.exit(summary.status);

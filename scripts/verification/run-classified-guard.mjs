import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contract from '../../data/contracts/verification.json' with { type: 'json' };
import {
    createClassifiedGuardExecutor,
    resolveGuard,
} from './classified-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv.at(2);
const guard = resolveGuard(contract.architecture, mode);
const execute = createClassifiedGuardExecutor(root, contract);

process.exit(execute(guard));

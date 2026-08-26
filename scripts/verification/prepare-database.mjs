import { spawnSync } from 'node:child_process';
import contract from '../../data/contracts/verification.json' with { type: 'json' };

const available = (command) => spawnSync(
    command,
    contract.database.versionArguments,
    { stdio: 'ignore', shell: false },
).status === contract.statuses.success;

const docker = contract.database.commandCandidates.find(available);
if (!docker) {
    console.error('Docker is required for Account database integration.');
    process.exit(contract.statuses.failure);
}

const start = spawnSync(docker, contract.database.startupArguments, {
    env: process.env,
    stdio: 'inherit',
    shell: false,
});

const migrate = start.status === contract.statuses.success
    ? spawnSync(
        contract.database.migrationCommand,
        contract.database.migrationArguments,
        { env: process.env, stdio: 'inherit', shell: false },
    )
    : start;

process.exit(migrate.status ?? contract.statuses.failure);

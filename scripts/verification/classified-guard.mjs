import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const directoryEntries = (directory) => fs.readdirSync(directory, { withFileTypes: true });

const sourceTargets = (directory, extensions) => directoryEntries(directory)
    .flatMap((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory()
            ? sourceTargets(target, extensions)
            : extensions.includes(path.extname(entry.name)) ? [target] : [];
    });

const targetResolvers = {
    repository: (root) => () => [root],
    sourceFiles: (root) => (target) => sourceTargets(
        path.join(root, target.root),
        target.extensions,
    ),
};

const requireValue = (value, message) => value ?? (() => {
    throw new Error(message);
})();

export const structuralWarnings = (output, prefixes) => output
    .split(/\r?\n/)
    .filter((line) => prefixes.some((prefix) => line.startsWith(prefix)));

export const resolveGuard = (architecture, mode) => requireValue(
    architecture.guards[mode],
    architecture.messages.unknownMode,
);

export const createClassifiedGuardExecutor = (root, contract) => (guard) => {
    const { architecture, statuses } = contract;
    const classifiedRoot = requireValue(
        architecture.classifiedCandidates
            .map((candidate) => path.resolve(root, candidate))
            .find((candidate) => fs.existsSync(path.join(candidate, guard.script))),
        architecture.messages.unavailable,
    );
    const targets = requireValue(
        targetResolvers[guard.target.kind],
        architecture.messages.unknownMode,
    )(root)(guard.target);
    const result = spawnSync('bash', [path.join(classifiedRoot, guard.script), ...targets], {
        cwd: root,
        encoding: 'utf8',
        shell: false,
    });
    const standardOutput = result.stdout ?? '';
    const errorOutput = result.stderr ?? '';
    process.stdout.write(standardOutput);
    process.stderr.write(errorOutput);
    const failed = [
        result.status !== statuses.success,
        structuralWarnings(`${standardOutput}\n${errorOutput}`, guard.strictWarningPrefixes)
            .length > statuses.success,
    ].some(Boolean);
    return failed ? statuses.failure : statuses.success;
};

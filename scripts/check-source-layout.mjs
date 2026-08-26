import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contract from '../data/contracts/verification.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(contract.layout.excludedDirectories);
const extensions = new Set(contract.layout.extensions);

const entries = (directory) => fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true })
    : [];

const authoredDirectories = (directory) => entries(directory)
    .filter((entry) => entry.isDirectory() && !excluded.has(entry.name));

const authoredFiles = (directory) => entries(directory).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
        ? excluded.has(entry.name) ? [] : authoredFiles(target)
        : extensions.has(path.extname(entry.name)) ? [target] : [];
});

const directories = (directory) => [
    directory,
    ...authoredDirectories(directory).flatMap((entry) =>
        directories(path.join(directory, entry.name))),
];

const roots = contract.layout.roots
    .map((directory) => path.join(root, directory))
    .filter(fs.existsSync);

const lineViolations = roots
    .flatMap(authoredFiles)
    .map((file) => ({
        file,
        lines: fs.readFileSync(file, 'utf8').split(/\r?\n/).length,
    }))
    .filter(({ lines }) => lines > contract.layout.maximumLines)
    .map(({ file, lines }) => `${path.relative(root, file)}: ${lines} lines`);

const fanOutViolations = roots
    .flatMap(directories)
    .map((directory) => ({
        directory,
        count: authoredDirectories(directory).length,
    }))
    .filter(({ count }) => count > contract.layout.maximumDirectSubdomains)
    .map(({ directory, count }) => `${path.relative(root, directory)}: ${count} direct subdomains`);

const violations = [...lineViolations, ...fanOutViolations];
violations.forEach((violation) => console.error(violation));

if (violations.length > contract.statuses.success) {
    console.error('Split each finding into named concern subdomains nested under its owning domain.');
    process.exit(contract.statuses.failure);
}

console.log('Authored files and concern trees remain within their declared boundaries.');

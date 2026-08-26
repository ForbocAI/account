import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const generatedPaths = (root, boundary) => ({
    source: path.join(root, boundary.source),
    hidden: path.join(root, boundary.hidden),
});

const recoverGenerated = ({ source, hidden }) => {
    if (!fs.existsSync(source) && fs.existsSync(hidden)) {
        fs.mkdirSync(path.dirname(source), { recursive: true });
        fs.renameSync(hidden, source);
    }
};

export const withGeneratedBoundary = (root, boundary) => (effect) => {
    const paths = generatedPaths(root, boundary);
    recoverGenerated(paths);
    if (!fs.existsSync(paths.source)) {
        return effect();
    }
    if (fs.existsSync(paths.hidden)) {
        throw new Error(`Generated verification boundary already exists: ${paths.hidden}`);
    }

    fs.mkdirSync(path.dirname(paths.hidden), { recursive: true });
    fs.renameSync(paths.source, paths.hidden);
    try {
        return effect();
    } finally {
        fs.mkdirSync(path.dirname(paths.source), { recursive: true });
        fs.renameSync(paths.hidden, paths.source);
    }
};

export const evaluateStages = (statuses, execute) => (stages) => {
    const results = stages.map((stage) => ({
        id: stage.id,
        status: execute(stage),
    }));
    return {
        results,
        status: results.some((result) => result.status !== statuses.success)
            ? statuses.failure
            : statuses.success,
    };
};

export const createProcessStageExecutor = (root, environment) =>
    (boundary, statuses) => (stage) => {
        const execute = () => {
            const result = spawnSync(stage.command, stage.arguments, {
                cwd: root,
                env: environment,
                stdio: 'inherit',
                shell: false,
            });
            return result.status ?? statuses.failure;
        };
        return stage.hideGenerated
            ? withGeneratedBoundary(root, boundary)(execute)
            : execute();
    };

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import fixture from '../../../../data/tests/verification.json';
import verificationContract from '../../../../data/contracts/verification.json';
import {
    evaluateStages,
    withGeneratedBoundary,
} from '../../../../scripts/verification/stage-runner.mjs';
import { structuralWarnings } from '../../../../scripts/verification/classified-guard.mjs';

type VerificationStage = (typeof fixture.stages)[number];

describe(fixture.suite, () => {
    it(fixture.cases.complete, () => {
        const observed = new Set<string>();
        const summary = evaluateStages(fixture.statuses, (stage: VerificationStage) => {
            observed.add(stage.id);
            return stage.status;
        })(fixture.stages);

        expect([...observed]).toEqual(fixture.expectedStageIds);
        expect(summary.status).toBe(fixture.statuses.failure);
    });

    it(fixture.cases.restoreSuccess, () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), fixture.generated.temporaryPrefix));
        const boundary = {
            source: fixture.generated.sourceDirectory,
            hidden: fixture.generated.hiddenDirectory,
        };
        const source = path.join(root, boundary.source);
        const marker = path.join(source, fixture.generated.markerFile);
        fs.mkdirSync(source, { recursive: fixture.booleans.yes });
        fs.writeFileSync(marker, fixture.generated.content);

        withGeneratedBoundary(root, boundary)(() => {
            expect(fs.existsSync(source)).toBe(fixture.booleans.no);
            expect(fs.readFileSync(path.join(
                root,
                boundary.hidden,
                fixture.generated.markerFile,
            ), fixture.encoding as BufferEncoding)).toBe(fixture.generated.content);
        });

        expect(fs.readFileSync(
            marker,
            fixture.encoding as BufferEncoding,
        )).toBe(fixture.generated.content);
        fs.rmSync(root, { recursive: fixture.booleans.yes, force: fixture.booleans.yes });
    });

    it(fixture.cases.restoreFailure, () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), fixture.generated.temporaryPrefix));
        const boundary = {
            source: fixture.generated.sourceDirectory,
            hidden: fixture.generated.hiddenDirectory,
        };
        const source = path.join(root, boundary.source);
        const marker = path.join(source, fixture.generated.markerFile);
        fs.mkdirSync(source, { recursive: fixture.booleans.yes });
        fs.writeFileSync(marker, fixture.generated.content);

        expect(() => withGeneratedBoundary(root, boundary)(() => {
            throw new Error(fixture.generated.failure);
        })).toThrow(fixture.generated.failure);
        expect(fs.readFileSync(
            marker,
            fixture.encoding as BufferEncoding,
        )).toBe(fixture.generated.content);
        fs.rmSync(root, { recursive: fixture.booleans.yes, force: fixture.booleans.yes });
    });

    it(fixture.cases.structuralWarnings, () => {
        const [structuralWarning] = verificationContract.architecture.guards.fp
            .strictWarningPrefixes;
        const output = [
            fixture.guardOutput.path,
            structuralWarning,
            fixture.guardOutput.advisory,
        ].join(fixture.guardOutput.lineSeparator);

        expect(structuralWarnings(
            output,
            verificationContract.architecture.guards.fp.strictWarningPrefixes,
        )).toEqual([structuralWarning]);
    });

    it(fixture.cases.advisoryWarnings, () => {
        expect(structuralWarnings(
            fixture.guardOutput.advisory,
            verificationContract.architecture.guards.fp.strictWarningPrefixes,
        )).toEqual([]);
    });
});

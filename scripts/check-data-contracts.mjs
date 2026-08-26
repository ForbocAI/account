import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const authContract = JSON.parse(fs.readFileSync(
    path.join(root, 'data/contracts/auth.json'),
    'utf8',
));
const proxyPath = path.join(root, 'src/proxy.ts');
const proxySource = ts.createSourceFile(
    proxyPath,
    fs.readFileSync(proxyPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const configDeclaration = proxySource.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)
    .find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'config');

const matcherProperty = configDeclaration?.initializer
    && ts.isObjectLiteralExpression(configDeclaration.initializer)
    ? configDeclaration.initializer.properties.find((property) =>
        ts.isPropertyAssignment(property)
        && ts.isIdentifier(property.name)
        && property.name.text === 'matcher')
    : null;

const matcher = matcherProperty
    && ts.isPropertyAssignment(matcherProperty)
    && ts.isArrayLiteralExpression(matcherProperty.initializer)
    ? matcherProperty.initializer.elements[0]
    : null;

if (!matcher || !ts.isStringLiteral(matcher) || matcher.text !== authContract.navigationMatcher) {
    throw new Error('src/proxy.ts matcher must mirror data/contracts/auth.json');
}

console.log('Auth proxy static matcher mirrors the authored JSON contract.');

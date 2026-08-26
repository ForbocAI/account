import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const authContract = JSON.parse(fs.readFileSync(
    path.join(root, 'data/contracts/auth.json'),
    'utf8',
));
const loggingContract = JSON.parse(fs.readFileSync(
    path.join(root, 'data/contracts/redux-logging.json'),
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

const loggingPath = path.join(root, 'src/components/state/safeReduxLogger.ts');
const loggingSource = ts.createSourceFile(
    loggingPath,
    fs.readFileSync(loggingPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);
const publicEnvironmentNames = [];
const collectEnvironmentNames = (node) => {
    const expression = ts.isPropertyAccessExpression(node) ? node.expression : null;
    if (
        expression
        && ts.isPropertyAccessExpression(expression)
        && ts.isIdentifier(expression.expression)
        && expression.expression.text === 'process'
        && expression.name.text === 'env'
    ) {
        publicEnvironmentNames.push(node.name.text);
    }
    ts.forEachChild(node, collectEnvironmentNames);
};
collectEnvironmentNames(loggingSource);

if (!publicEnvironmentNames.includes(loggingContract.environment)) {
    throw new Error('Safe Redux logger environment mirror must match its JSON contract');
}

console.log('Static framework mirrors match their authored JSON contracts.');

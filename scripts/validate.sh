#/usr/bin/env bash

if [ -z "$CI" ]; then
  yarn lint
  yarn typecheck
  yarn test --ci
  yarn build:api
else
  yarn lint --quiet
  yarn typecheck
  export JEST_JUNIT_OUTPUT=".temp/test-reports/junit/results.xml"
  yarn test --ci --runInBand --coverage --reporters="jest-junit"
  yarn build:api
fi

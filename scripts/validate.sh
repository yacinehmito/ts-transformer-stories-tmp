#/usr/bin/env bash

set -e

if [ -z "$CI" ]; then
  yarn lint
  yarn typecheck
  yarn test --ci
  yarn build:api
else
  DIR=$(dirname "$0")
  export JEST_JUNIT_OUTPUT="$DIR/../.temp/test-reports/junit/results.xml"
  ls "$DIR/../node_modules"

  yarn lint --quiet
  yarn typecheck
  yarn test --ci --runInBand --coverage --reporters="$DIR/../node_modules/jest-junit"
  yarn build:api
fi

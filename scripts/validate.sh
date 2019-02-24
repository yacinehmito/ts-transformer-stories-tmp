#/usr/bin/env bash

if [ -z "$CI" ]; then
  yarn lint
  yarn typecheck
  yarn test --ci
  yarn build:api
else
  yarn lint --quiet
  yarn typecheck
  yarn test --ci --runInBand --coverage
  yarn build:api
fi

# Changelog

All notable changes to this project will be documented in this file.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.0.63]

### Changed

- Point explain to different backend endpoint

## [0.0.62]

### Changed

- Improved error grouping

## [0.0.61]

### Added

- Explaining the error using ChatGPT without the need for an API key

## [0.0.60]

### Added

- Querying errors in user's environment
- Explaining the error using ChatGPT

## [0.0.59]

### Added

- Field flag to the tail command
- Improved README

## [0.0.58]

### Added

- Enable baselime pull to clone existing and discovered services 
- Add filters and calculations 
  - COUNT_DISTINCT
  - STDDEV
  - VARIANCE
  - LIKE
  - NOT_LIKE
  - DOES_NOT_INCLUDE
  - MATCH_REGEX

## [0.0.57]

### Added

- Ability to initialise an existing service

## [0.0.56]

### Fixed

- Do not attempt to update the onboarding for the demo user

## [0.0.55]

- Add calculation alias to queries
- Add support for dashboards Observability as Code

## [0.0.54] 2023-02-23

### Added

- Add service to get keys and tidy up query runs create
- Add the ability to have filter keys with parantheses

## [0.0.52] 2023-02-02

### Added

- Add ca-central-1 to the supported regions
- Add onboarding events to signing up

## [0.0.50] 2023-02-02

- Nicely format templates when calling `baselime templates get`

## [0.0.48] 2023-01-30

### Removed

- removed postinstall script
- 
### Changed

- Simplified error report command
- Added --recurse to baselime templates publish


### Added

- Illustration in the local login screen

### Changed

- Simplified query command

### Added

- A npm post-install script
- Signup from CLI

### Changed

- baselime environments connect is now interactive
- baselime login is more interactive
- Improved flow in baselime init
- Improved flow in baselime query


## [0.0.44] 2023-01-26

### Added

- Interactive query builder

### Changed

- The slack channel the updates are posted to

### Removed

- Removed the CF stack stage in the baselime init command

## [0.0.43] 2023-01-19

### Fixed

- Clarifications in commands documentations
- Fix environment alias and replace with id throughout
- Add space to prevent mentions in Slack update CI

## [0.0.42] 2023-01-18

### Fixed

- Clarifications in commands documentations
- Making selecting stacks in the baselime init command more straightforward
- Do not prompt for the query if the query id is provided in the baselime query command 
- Fix baselime query output edge cases
- Ensure that query filters where values are lists are always between parantheses '()'

### Changed

- baselime init adds the template in the index.yml file instead of downloading it
- Adopt rome.tools for linting and formatting
- Linted and formatted the whole repo

### Added

- Added support for quiet alert checks
- Added support for baselime report slack
- Linting as part of CI/CD
- Facilitate connecting an AWS Account from the CLI

### Removed

- Removed the alias on the debug flag

## [0.0.41] 2022-12-23

### Fixed

- Add package:alpine npm command 

## [0.0.40] 2022-12-23

### Fixed

- Fixed and refactored baselime login

## [0.0.39] 2022-12-22

### Added
- baselime login improvements
- google oauth flow to login
- baselime login --demo to run the demo

## [0.0.38] 2022-12-19

### Added
- Producing alert report as file or stdout

## [0.0.36] 2022-12-19

### Added

- Added support for STARTS_WITH query filter
- Added support for namespaces in query filters using $baselime.namespace as key
- Allow $ in query filters

### Deprecated

- namespaces and namespaceCombination in query definitions
- Removed the concept of namespaceCombination

## [0.0.35] 2022-12-16

### Removed

- Removed `baselime stream` command

### Added

- Added `baselime tail` command

## [0.0.34] 2022-12-16

### Removed

- Removed `baselime plan` command

### Added

- Added `--dry-run` to `baselime push` command

## [0.0.33] 2022-12-16

### Removed

- `--short` flag in `plan` command

## [0.0.32] 2022-12-15

### Added

- Improved inline documentation
- Improved messaging when an error occurs

## [0.0.31] 2022-12-15

### Added

- Add option for shorter diff in `baselime plan`

## [0.0.30] 2022-12-14

### Added

- Enables creating snapshots from within the `report` command

### Changed

- Reduces Docker image size

### Fixed

- Bug fixes

## [0.0.29] 2022-12-13

### Fixed

- Bug fixes

## [0.0.28] 2022-12-13

### Added

- Add support for template variables
- Add baselime stream command

### Changed
- Improve output of query runs
- Rename `baselime comment` to `baselime report`
- Rename `baselime templates create` to `baselime templates report`

### Fixed

- Bug fixes

## [0.0.27] 2022-12-7

### Fixed

- Bug fixes

## [0.0.26] 2022-12-6

### Added

- Enable definition of multiple possible values for variables and select in the command flags

## [0.0.25] 2022-12-05

### Added

- Add support for negative numbers as alert thresholds
- Validate filters, calculations, thesholds and order bys inline
- Add `templates` commands
- Add support for observability as code variables
- Add support for inline variables
- Add support for running queries without calculations

### Changed

- Rename applications to services

## [0.0.24] 2022-11-30

### Added

- Add support for inline channels in alerts
- Add `baselime query` command

### Changed

- Rename `apply` to `push`
- Rename `refresh` to `pull`

### Deprecated

- Deprecate channels

## [0.0.23] 2022-11-11

- Add support for search needles in queries
- Add support for multiple datasets in queries

## [0.0.22] 2022-10-31

- Add support for `orderBy`, `limit` and `order` in queries
- Add support for geting API key from environment variable
- `imported` folder for resources imported with `baselime refresh`
- Deprecate dashboards
- Deprecate charts
- Deprecate email alerts
- Deprecate individual functions in `index.yml` file

## [0.0.21] 2022-10-09

- Add Dockerfile
- Imporoved prompts
- Improved outputs
- Bug fixes

## [0.0.20] 2022-10-08

- Add support for `comment` commands
- Add support for `status` command
- Improved outputs
- Bug fixes

## [0.0.19] 2022-10-03

- Add support for cron expression for alerts
- Improved outputs
- Remove the need for `auth` when `login`, `logout` and `iam`
- Bug fixes

## [0.0.18] 2022-09-26

- Add support for stacks in the application definition
- Add support for `IN` and `NOT_IN` operations for query filters
- Add dataset to `events stream` command output
- Feedback on the status of a `apply` command
- Interactive `init` command
- Interactive `queries run` command
- Bug fixes

## [0.0.17] 2022-09-21

- Add support for the application flag in the `events stream` command

## [0.0.16] 2022-09-19

- Add support for filters and searches in the `events stream` command
- Error handling
- Bug fixes

## [0.0.15] 2022-09-13

- Remove the need for `:` when declaring query filters and alert thresholds

## [0.0.14] 2022-09-12

- Enable setting the `provider` in an application
- Enable setting the `functions` and `infrastructure` in the `index.yml` for an application
- List `functions` when running `baselime init` to populate the `infrastructure` field of the `index.yml` 
- Bug fixes

## [0.0.13] 2022-09-08

- Implement `refresh` command
- Enable setting up global namespaces for all queries in an application
- Bug fixes

## [0.0.12] 2022-09-05

- Bug fixes

## [0.0.11] 2022-09-02

- Implement `plan` and `destroy` commands
- Bug fixes

## [0.0.10] 2022-08-24

- Add support for `slack` and `webhook` channel types
- Bug fixes

## [0.0.9] 2022-08-12

- Add support for templates when initialising a new application with `baselime init`
- Bug fixes

## [0.0.8] 2022-09-01

- Migrate to using a `.baselime` folder rather than a `.baselime.yml` file

## [0.0.7] 2022-07-29

- Adds `dashboards` command
- Prevents unknown keys in resources schemas
- Adds collection of telemetry data
- Bug fixes

## [0.0.6] 2022-07-04

- Adds `channels` command
- Adds `charts` command
- Add support for queries with `groupBy`
- Bug fixes

## [0.0.5] 2022-06-17

- Adds `upgrade` command
- Improves default query and alert created with `init` command
- Add `environment setup` command
- Bug fixes

## [0.0.4] 2022-06-03

- Adds `--follow` flag to `events stream` command
- Adds namespace combination to queries and the `events stream` command
- Simplifies query filters
- Simplifies alert thresholds
- Adds sample queries, alerts and channels in the file generated by `baselime init`
- Bug fixes

## [0.0.3] 2022-05-23

- Adds `auth` commands
- Adds `applications` commands
- Adds `namsepaces` commands
- Adds `events` commands
- Adds `--debug` flag
- Impoves error messages
- Better documentation
- Bug fixes

## [0.0.2] 2022-05-05

- Adds support for alerts channels
- Bug fixes

## [0.0.1] 2022-04-18

- Initial release
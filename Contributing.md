# Contributing to Baselime CLI

You want to help improve the Baselime CLI? Awesome, thank you!

## Reporting Issues 

Bugs, feature requests, and development-related questions should be directed to our [GitHub issue tracker](https://github.com/baselime/cli/issues).

When reporting a bug, please try and provide as much context as possible such as your operating system, Node version, and anything else that might be relevant to the bug. For feature requests, please explain what you're trying to do, and how the requested feature would help you do that.

## Building and Packaging the project

### Prerequisites:

- Node 16.15+ Installed.

```shell
$ npm run build
```

- Packaging the binary

```shell
# Linux
$ npm run package:linux

# MacOS
$ npm run package:macos
```
 
## Setup

[Fork](https://github.com/baselime/cli) then clone this repository:

```
$ git clone https://github.com/baselime/cli.git
$ cd cli
$ npm ci
```

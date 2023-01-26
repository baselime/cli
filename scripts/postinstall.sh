#!/usr/bin/env bash

set -e

green=`tput setaf 2`
nc=`tput sgr0`

echo -e "\n${green}✔${nc} baselime cli succesfully installed"
echo -e "\nWhat now?"
echo -e "# Run ${green}baselime login${nc} and become a baselimer!"

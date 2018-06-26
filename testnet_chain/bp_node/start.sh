#!/bin/bash
DATADIR=$(pwd)/data

if [ ! -d "$DATADIR" ]; then
    mkdir -p $DATADIR
fi

$(pwd)/stop.sh
echo -e "Starting Nodeos \n";

nodeos --data-dir $DATADIR --config-dir $(pwd) "$@" > $DATADIR/stdout.txt 2> $DATADIR/stderr.txt &  echo $! > $DATADIR/nodeos.pid
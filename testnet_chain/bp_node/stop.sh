#!/bin/bash

DATADIR=$(pwd)/data

 if [ -f $DATADIR"/nodeos.pid" ]; then
    pid=`cat $DATADIR"/nodeos.pid"`
    echo $pid
    kill $pid
    rm -r $DATADIR"/nodeos.pid"

    echo -ne "Stoping Nodeos"

        while true; do
            [ ! -d "/proc/$pid/fd" ] && break
            echo -ne "."
            sleep 1
        done
        echo -ne "\rNodeos Stopped.    \n"
    fi

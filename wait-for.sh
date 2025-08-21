#!/usr/bin/env bash
# Minimal wait-for script. Usage: ./wait-for.sh host:port -- command
set -e

hostport="$1"
shift
# parse host and port
host=$(echo $hostport | cut -d: -f1)
port=$(echo $hostport | cut -d: -f2)

cmd=("$@")
until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port ..."
  sleep 1
done

exec "${cmd[@]}"

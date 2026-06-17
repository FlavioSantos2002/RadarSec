#!/bin/sh
set -e

echo ">> Gerando cliente Prisma..."
npx prisma generate

echo ">> Aplicando migrações..."
npx prisma migrate deploy

echo ">> Iniciando RadarSec API..."
exec npx ts-node-dev --respawn --transpile-only src/index.ts

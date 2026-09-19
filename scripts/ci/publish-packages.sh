#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-ghcr.io/comptasse/fec}"

if [ -n "${RELEASE_TAG:-}" ]; then
    VERSION="$RELEASE_TAG"
else
    VERSION="$(cat VERSION)"
fi
export VERSION

echo "Publishing version ${VERSION} to ${REGISTRY} as ${IMAGE_PREFIX}:${VERSION}"

BUILDER="default"
docker buildx use "$BUILDER"
docker buildx inspect --bootstrap >/dev/null

docker compose -f workflows/build/compose.yml build

SRC="fec:${VERSION}"
DEST="${IMAGE_PREFIX}"

docker tag "${SRC}" "${DEST}:${VERSION}"
docker push "${DEST}:${VERSION}"

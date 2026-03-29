#!/usr/bin/env bash

set -euo pipefail

BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"
HEAD_SHA="${VERCEL_GIT_COMMIT_SHA:-}"

if [ -z "${BASE_SHA}" ] || [ -z "${HEAD_SHA}" ]; then
  echo "Missing Vercel commit range. Building admin."
  exit 1
fi

if ! git cat-file -e "${BASE_SHA}^{commit}" >/dev/null 2>&1; then
  echo "Previous commit is unavailable in checkout. Building admin."
  exit 1
fi

if ! git cat-file -e "${HEAD_SHA}^{commit}" >/dev/null 2>&1; then
  echo "Current commit is unavailable in checkout. Building admin."
  exit 1
fi

CHANGED_FILES="$(git diff --name-only "${BASE_SHA}" "${HEAD_SHA}")"

if [ -z "${CHANGED_FILES}" ]; then
  echo "No file changes detected. Skipping admin deploy."
  exit 0
fi

while IFS= read -r file_path; do
  case "${file_path}" in
    apps/admin/*|packages/ui/*|packages/supabase/*|packages/types/*|packages/email/*|packages/typescript-config/*|package.json|yarn.lock|turbo.json)
      echo "Admin-impacting change found: ${file_path}"
      exit 1
      ;;
  esac
done <<< "${CHANGED_FILES}"

echo "Only non-admin paths changed. Skipping admin deploy."
exit 0

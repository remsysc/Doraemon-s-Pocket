#!/bin/bash
set -e

PAYLOAD=$(cat)
TRANSCRIPT_PATH=$(echo "$PAYLOAD" | grep -oP '"transcriptPath"\s*:\s*"\K[^"]+')

echo '{"injectSteps": []}' > /tmp/hook_out.json

if [ -f "$TRANSCRIPT_PATH" ]; then
    LAST_PLANNER=$(grep '"type":"PLANNER_RESPONSE"' "$TRANSCRIPT_PATH" | tail -n 1)
    if echo "$LAST_PLANNER" | grep -q 'write_to_file\|replace_file_content'; then
        if echo "$LAST_PLANNER" | grep -q '\.php'; then
            TEST_OUT=$(php artisan test --compact 2>&1 || true)
            if echo "$TEST_OUT" | grep -q 'FAIL'; then
                # Build JSON properly with jq
                jq -n --arg msg "⚠️ **Auto-QA Alert**: Your recent PHP changes broke the tests. Please fix them!

\`\`\`
$TEST_OUT
\`\`\`" \
                '{injectSteps: [{ephemeralMessage: $msg}], terminationBehavior: "force_continue"}' > /tmp/hook_out.json
            else
                jq -n --arg msg "✅ **Auto-QA Alert**: PHP changes detected. Tests ran automatically and passed!" \
                '{injectSteps: [{ephemeralMessage: $msg}]}' > /tmp/hook_out.json
            fi
        elif echo "$LAST_PLANNER" | grep -q '\.tsx\|\.ts\|\.css'; then
            BUILD_OUT=$(npm run build 2>&1 || true)
            if echo "$BUILD_OUT" | grep -q 'failed\|error'; then
                jq -n --arg msg "⚠️ **Auto-QA Alert**: Frontend build failed!
\`\`\`
$BUILD_OUT
\`\`\`" \
                '{injectSteps: [{ephemeralMessage: $msg}], terminationBehavior: "force_continue"}' > /tmp/hook_out.json
            else
                jq -n --arg msg "✅ **Auto-QA Alert**: Frontend build succeeded automatically." \
                '{injectSteps: [{ephemeralMessage: $msg}]}' > /tmp/hook_out.json
            fi
        fi
    fi
fi

cat /tmp/hook_out.json

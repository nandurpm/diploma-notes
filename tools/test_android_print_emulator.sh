#!/bin/sh
set -eu

PACKAGE=org.diplomanotes.polytechnicstudyhub
ACTIVITY=org.diplomanotes.polytechnicstudyhub/.MainActivity
LESSON_URL='https://polypmna.dpdns.org/lessons/lessons-1001.html?autoPrintNotes=1&androidEmulatorPrintTest=1'
ARTIFACT_DIR=emulator-artifacts
mkdir -p "$ARTIFACT_DIR"

install_status=0
adb install -r "$ARTIFACT_DIR/POLY_PMNA.apk" > "$ARTIFACT_DIR/install.txt" 2>&1 || install_status=$?
if [ "$install_status" -ne 0 ]; then
  echo "APK install failed with status $install_status." >&2
  cat "$ARTIFACT_DIR/install.txt" >&2 || true
  exit 1
fi

adb logcat -c >> "$ARTIFACT_DIR/install.txt" 2>&1 || true
# A stale package is not fatal; the following activity launch is the decisive check.
adb shell am force-stop "$PACKAGE" >> "$ARTIFACT_DIR/install.txt" 2>&1 || true
start_status=0
adb shell am start -W -n "$ACTIVITY" -a android.intent.action.VIEW -d "$LESSON_URL" > "$ARTIFACT_DIR/activity-start.txt" 2>&1 || start_status=$?
if [ "$start_status" -ne 0 ]; then
  echo "Lesson activity launch failed with status $start_status." >&2
  cat "$ARTIFACT_DIR/activity-start.txt" >&2 || true
  exit 1
fi

# The lesson’s shared script waits briefly after WebView load before invoking the
# trusted Android print bridge. Poll the UI and Android window/activity state.
# uiautomator can transiently return exit code 2 while windows change, so retain
# its error text instead of aborting before logcat is captured.
print_dialog=false
attempt=1
while [ "$attempt" -le 30 ]; do
  sleep 1
  ui_dump="$ARTIFACT_DIR/window-${attempt}.xml"
  ui_err="$ARTIFACT_DIR/uiautomator-${attempt}.txt"
  if adb shell uiautomator dump /sdcard/window.xml > "$ui_err" 2>&1; then
    adb pull /sdcard/window.xml "$ui_dump" >> "$ui_err" 2>&1 || true
  fi
  window_state="$ARTIFACT_DIR/window-${attempt}.txt"
  activity_state="$ARTIFACT_DIR/activity-${attempt}.txt"
  adb shell dumpsys window windows > "$window_state" 2>&1 || true
  adb shell dumpsys activity activities > "$activity_state" 2>&1 || true
  # The lesson itself contains “Save as PDF”, so labels alone are insufficient.
  # Require Android Print Spooler or a print activity in the system state.
  if grep -Eqi 'com\.android\.printspooler|PrintActivity|SelectPrinterActivity|PrintPreview' "$ui_dump" "$ui_err" "$window_state" "$activity_state" 2>/dev/null; then
    print_dialog=true
    break
  fi
  attempt=$((attempt + 1))
done

adb logcat -d -v threadtime > "$ARTIFACT_DIR/logcat.txt" || true
adb shell dumpsys activity activities > "$ARTIFACT_DIR/activity-stack.txt" 2>&1 || true
adb shell dumpsys window windows > "$ARTIFACT_DIR/final-window-state.txt" 2>&1 || true
adb shell dumpsys print > "$ARTIFACT_DIR/print-state.txt" 2>&1 || true

if grep -Eqi 'FATAL EXCEPTION|AndroidRuntime:.*(Exception|Error)|Process: org\.diplomanotes\.polytechnicstudyhub.*(Exception|Error)' "$ARTIFACT_DIR/logcat.txt"; then
  echo 'Android runtime exception found in logcat.' >&2
  grep -Ein -C 4 'FATAL EXCEPTION|AndroidRuntime|Process: org\.diplomanotes\.polytechnicstudyhub' "$ARTIFACT_DIR/logcat.txt" || true
  exit 1
fi

if [ "$print_dialog" != true ]; then
  echo 'Native Android Print Spooler preview was not detected after lesson auto-print.' >&2
  echo 'Captured PolyNativePrint and PrintManager lines:' >&2
  grep -Ein -C 3 'PolyNativePrint|PrintManager|printspooler|PrintActivity|SelectPrinterActivity' "$ARTIFACT_DIR/logcat.txt" || true
  tail -100 "$ARTIFACT_DIR/logcat.txt" || true
  exit 1
fi

echo 'Native Android Print Spooler / Save as PDF dialog detected with no Android runtime exception.'

const displayTime = document.querySelector("#displayTime");
const nextPushCountdown = document.querySelector("#nextPushCountdown");
const wakeStatus = document.querySelector("#wakeStatus");

function updateDisplayClock() {
  const now = new Date();
  displayTime.textContent = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(now);

  const nextPush = new Date(now);
  nextPush.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  if (nextPush <= now) nextPush.setMinutes(nextPush.getMinutes() + 15);
  const minutes = Math.max(1, Math.ceil((nextPush - now) / 60000));
  nextPushCountdown.textContent = `Next push in ${minutes}m`;
}

async function keepDisplayAwake() {
  if (!("wakeLock" in navigator)) {
    wakeStatus.textContent = "Wake lock not supported";
    return;
  }

  try {
    let wakeLock = await navigator.wakeLock.request("screen");
    wakeStatus.textContent = "Screen wake lock active";

    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState !== "visible") return;
      wakeLock = await navigator.wakeLock.request("screen");
      wakeStatus.textContent = wakeLock ? "Screen wake lock active" : "Wake lock unavailable";
    });
  } catch {
    wakeStatus.textContent = "Keep browser visible for always-on display";
  }
}

updateDisplayClock();
setInterval(updateDisplayClock, 1000);
keepDisplayAwake();

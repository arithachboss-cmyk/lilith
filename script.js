const sampleSpec = `Goal: make Project Lilith easier to operate while the work is already in motion.

Workflow:
- Keep the Lilith operation visible.
- Make Google Drive spec decisions easy to scan.
- Reduce context switching between reading, deciding, and acting.
- Keep next actions close to the source context.
- Add marketing and service planning as a visible operating layer.

Open:
- Confirm the exact Lilith Google Drive source.
- Replace sample assumptions with spec-grounded Lilith requirements.
- Decide which controls should become persistent project settings.
- Validate the first target audience and service promise.`;

const specInput = document.querySelector("#specInput");
const goals = document.querySelector("#goals");
const workflow = document.querySelector("#workflow");
const openItems = document.querySelector("#openItems");

document.querySelector("#loadSample").addEventListener("click", () => {
  specInput.value = sampleSpec;
  analyzeSpec();
});

document.querySelector("#analyzeSpec").addEventListener("click", analyzeSpec);

function analyzeSpec() {
  const lines = specInput.value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const buckets = {
    goals: [],
    workflow: [],
    open: [],
  };

  let activeBucket = "goals";
  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*]\s*/, "");
    const lower = line.toLowerCase();

    if (lower.startsWith("goal")) activeBucket = "goals";
    if (lower.startsWith("workflow")) activeBucket = "workflow";
    if (lower.startsWith("open") || lower.startsWith("question")) activeBucket = "open";

    if (line.endsWith(":")) continue;
    buckets[activeBucket].push(line.replace(/^(goal|workflow|open|question):\s*/i, ""));
  }

  renderList(goals, buckets.goals, ["Keep Lilith usable while details evolve."]);
  renderList(workflow, buckets.workflow, ["Read the Lilith source spec.", "Adapt layout and controls."]);
  renderList(openItems, buckets.open, ["Attach the exact Lilith Google Drive file once available."]);
}

function renderList(target, items, fallback) {
  target.innerHTML = "";
  const visibleItems = items.length ? items : fallback;
  for (const item of visibleItems.slice(0, 6)) {
    const li = document.createElement("li");
    li.textContent = item;
    target.append(li);
  }
}

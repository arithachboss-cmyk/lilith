const listings = [
  {
    title: "Muniq Sukhumvit 23",
    area: "Asoke / Sukhumvit",
    price: 33000,
    details: "1 bed · 42 sqm · high floor · fully furnished",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82",
    score: "96 match",
    meta: ["6 min MRT", "Owner verified", "No duplicate risk", "View today"],
  },
  {
    title: "Noble Around 33",
    area: "Phrom Phong",
    price: 30000,
    details: "1 bed · 35 sqm · quiet side · pet-friendly option",
    image: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=900&q=82",
    score: "94 match",
    meta: ["9 min BTS", "Below median", "Fast reply", "Deposit checked"],
  },
  {
    title: "The Lofts Ekkamai",
    area: "Thong Lo / Ekkamai",
    price: 42000,
    details: "1 bed loft · 48 sqm · city view · work desk ready",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=82",
    score: "91 match",
    meta: ["4 min BTS", "Fresh listing", "Video tour", "Flexible term"],
  },
  {
    title: "Rhythm Sukhumvit 36",
    area: "Thong Lo",
    price: 28000,
    details: "1 bed · 33 sqm · renovated · morning light",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=82",
    score: "89 match",
    meta: ["11 min BTS", "Great value", "Agent verified", "Route bundled"],
  },
];

const formatter = new Intl.NumberFormat("th-TH");
const listingList = document.querySelector("#listingList");
const matchCount = document.querySelector("#matchCount");
const filters = document.querySelector("#filters");
const budgetInput = document.querySelector("#budgetInput");
const areaInput = document.querySelector("#areaInput");
const generateLeadPlan = document.querySelector("#generateLeadPlan");
const leadConsole = document.querySelector("#leadConsole");

function renderListings() {
  const budget = Number(budgetInput.value);
  const areaTerms = areaInput.value
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);

  const visible = listings.filter((listing) => {
    const isAffordable = listing.price <= budget;
    const searchableText = `${listing.title} ${listing.area}`.toLowerCase();
    const matchesArea =
      areaTerms.length === 0 || areaTerms.some((term) => searchableText.includes(term));
    return isAffordable && matchesArea;
  });

  listingList.innerHTML = "";
  const fallback = visible.length ? visible : listings.filter((listing) => listing.price <= budget);

  for (const listing of fallback) {
    const card = document.createElement("article");
    card.className = "listing-card";
    card.innerHTML = `
      <div class="listing-photo">
        <img src="${listing.image}" alt="${listing.title} interior" />
        <span class="badge">${listing.score}</span>
      </div>
      <div class="listing-body">
        <div class="listing-title">
          <div>
            <h4>${listing.title}</h4>
            <p>${listing.area}</p>
          </div>
          <div class="price">฿${formatter.format(listing.price)}</div>
        </div>
        <p>${listing.details}</p>
        <div class="listing-meta">
          ${listing.meta.map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div class="listing-actions">
          <button type="button">Book viewing</button>
          <button type="button">Compare</button>
          <button type="button">LINE script</button>
        </div>
      </div>
    `;
    listingList.append(card);
  }

  matchCount.textContent = String(Math.max(fallback.length * 11 - (budget < 40000 ? 2 : 0), 8));
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  renderListings();
});

budgetInput.addEventListener("change", renderListings);
areaInput.addEventListener("input", renderListings);

generateLeadPlan.addEventListener("click", () => {
  const budget = formatter.format(Number(budgetInput.value));
  const anchors = areaInput.value || "BTS/MRT";
  leadConsole.innerHTML = `
    <strong>Lead plan ready</strong>
    <span>Publish refreshed listings near ${anchors}, prioritize rooms under ฿${budget}, send LINE replies within 15 minutes, and bundle qualified renters into same-day viewing routes.</span>
  `;
});

renderListings();

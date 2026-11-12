function normalize(value, max) {
    return value / max;
}

// Returns the total plus each component, so we can show a breakdown.
function calculatePrice(size, rooms, location, age,
                        parking, security, lift, garden, pool) {

    const normalizedSize = normalize(size, 5000);
    const normalizedLocation = normalize(location, 10);

    const parts = [
        { label: "Base price",       value: 500000 },
        { label: "Size",             value: normalizedSize * 1000000 },
        { label: "Rooms",            value: rooms * 150000 },
        { label: "Location",         value: normalizedLocation * 400000 },
        { label: "Age depreciation", value: -age * 7000 },
        { label: "Security",         value: security * 50000 }
    ];

    if (parking) parts.push({ label: "Parking",       value: 200000 });
    if (lift)    parts.push({ label: "Lift",          value: 150000 });
    if (garden)  parts.push({ label: "Garden",        value: 180000 });
    if (pool)    parts.push({ label: "Swimming pool", value: 400000 });

    const total = parts.reduce((sum, p) => sum + p.value, 0);
    return { total, parts };
}

// ₹ with Indian digit grouping, e.g. ₹12,50,000
function formatINR(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
}

// 1250000 -> "12.50 Lakh", 24000000 -> "2.40 Crore"
function toWords(n) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return (n / 1e7).toFixed(2) + " Crore";
    if (abs >= 1e5) return (n / 1e5).toFixed(2) + " Lakh";
    return formatINR(n);
}

function predictPrice() {
    const size = parseFloat(document.getElementById("size").value);
    const rooms = parseInt(document.getElementById("rooms").value);
    const location = parseFloat(document.getElementById("location").value);
    const age = parseInt(document.getElementById("age").value);
    const security = parseInt(document.getElementById("security").value);

    // isNaN checks (instead of !value) so an age of 0 is accepted
    const bad = [];
    if (isNaN(size) || size <= 0) bad.push("size");
    if (isNaN(rooms) || rooms < 1) bad.push("rooms");
    if (isNaN(location) || location < 1 || location > 10) bad.push("location");
    if (isNaN(age) || age < 0) bad.push("age");
    if (isNaN(security) || security < 1 || security > 5) bad.push("security");

    document.querySelectorAll("input").forEach(i => i.classList.remove("invalid"));

    if (bad.length) {
        bad.forEach(id => document.getElementById(id).classList.add("invalid"));
        document.getElementById("output").innerHTML =
            `<p class="error">Please fill all fields properly. Location must be 1-10 and security 1-5.</p>`;
        return;
    }

    const parking = document.getElementById("parking").value === "Yes";
    const lift = document.getElementById("lift").value === "Yes";
    const garden = document.getElementById("garden").value === "Yes";
    const pool = document.getElementById("pool").value === "Yes";

    const { total, parts } = calculatePrice(
        size, rooms, location, age,
        parking, security, lift, garden, pool
    );

    const low = total * 0.92;
    const high = total * 1.08;
    const maxAbs = Math.max(...parts.map(p => Math.abs(p.value)));
    const colors = ["", "c1", "c2", "c3"];

    // Feature 1: price breakdown bars
    const rows = parts.map((p, i) => `
        <div class="row">
            <div class="row-top">
                <span>${p.label}</span>
                <span>${p.value < 0 ? "−" : "+"}${formatINR(Math.abs(p.value))}</span>
            </div>
            <div class="track">
                <div class="bar ${p.value < 0 ? "neg" : colors[i % colors.length]}"
                     style="width:${(Math.abs(p.value) / maxAbs * 100).toFixed(1)}%"></div>
            </div>
        </div>`).join("");

    // Feature 2: lakh/crore words, price per sq ft, likely range
    document.getElementById("output").innerHTML = `
        <h3 style="margin:0;color:#3a3f6b">🏡 Predicted House Price</h3>
        <p class="price">${formatINR(total)}</p>
        <p class="words">${toWords(total)}</p>

        <div class="stats">
            <div class="stat"><small>Price per sq ft</small><strong>${formatINR(total / size)}</strong></div>
            <div class="stat"><small>Likely range (±8%)</small><strong>${toWords(low)} – ${toWords(high)}</strong></div>
        </div>

        <div class="breakdown">
            <h3>What drives this price</h3>
            ${rows}
        </div>
        <p class="note">This is a simple formula-based estimate, not a valuation.</p>`;
}

function clearInputs() {
    document.querySelectorAll("input").forEach(input => {
        input.value = "";
        input.classList.remove("invalid");
    });
    document.querySelectorAll("select").forEach(select => select.selectedIndex = 0);
    document.getElementById("output").innerHTML = "Inputs cleared.";
}
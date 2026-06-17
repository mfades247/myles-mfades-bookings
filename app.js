import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, query, where, orderBy,
  runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  todayStr, parseLocalDate, formatDateDisplay, formatTime12hr, generateSlots, isInPast, slotId
} from "./utils.js";

// ---- Shop info shown after a booking is confirmed ----
const SHOP = {
  address: "2602 Marble Rd, Normal IL 61761",
  directions: "When you are here walk in 7 steps and it is on your left and go down the stairs"
};

const SELECTORS = {
  dateCards: "#dateCards",
  bookingSection: "#bookingSection",
  selectedDate: "#selectedDate",
  timeSlots: "#timeSlots"
};

const dom = {};
let currentDateInfo = null; // { date: "2026-06-20", start: "09:00", end: "17:00" }

// ---------------- rendering ----------------

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

async function loadAvailableDates() {
  clearChildren(dom.dateCards);
  dom.dateCards.textContent = "Loading...";

  try {
    const q = query(
      collection(db, "availability"),
      where("date", ">=", todayStr()),
      orderBy("date", "asc")
    );
    const snap = await getDocs(q);
    clearChildren(dom.dateCards);

    if (snap.empty) {
      const msg = document.createElement("p");
      msg.textContent = "No booking days are open right now — check back soon.";
      dom.dateCards.appendChild(msg);
      return;
    }

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "date-card";
      card.textContent = formatDateDisplay(data.date);
      card.addEventListener("click", () => selectDate(data));
      dom.dateCards.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading available dates:", err);
    clearChildren(dom.dateCards);
    const msg = document.createElement("p");
    msg.textContent = "Couldn't load booking days. Please refresh, or check back shortly.";
    dom.dateCards.appendChild(msg);
  }
}

async function selectDate(dateInfo) {
  currentDateInfo = dateInfo;
  dom.bookingSection.style.display = "block";
  dom.selectedDate.textContent = formatDateDisplay(dateInfo.date);
  removeFloatingPanels();
  await renderSlotGrid(dateInfo);
}

// Renders the slot grid only — does NOT touch the confirmation/info panels.
// Used both for picking a date and for silently refreshing after a booking.
async function renderSlotGrid(dateInfo) {
  clearChildren(dom.timeSlots);
  dom.timeSlots.textContent = "Loading times...";

  try {
    const allSlots = generateSlots(dateInfo.start, dateInfo.end)
      .filter(t => !isInPast(dateInfo.date, t));

    const takenQuery = query(collection(db, "takenSlots"), where("date", "==", dateInfo.date));
    const takenSnap = await getDocs(takenQuery);
    const takenTimes = new Set(takenSnap.docs.map(d => d.data().time));

    clearChildren(dom.timeSlots);

    if (allSlots.length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "No more slots available for this date.";
      dom.timeSlots.appendChild(msg);
      return;
    }

    allSlots.forEach(time => {
      const taken = takenTimes.has(time);
      const slotEl = document.createElement("div");
      slotEl.className = `slot ${taken ? "booked" : "available"}`;
      slotEl.textContent = `${formatTime12hr(time)} - ${taken ? "Booked" : "Available"}`;
      if (!taken) {
        slotEl.addEventListener("click", () => handleSlotClick(time, slotEl));
      }
      dom.timeSlots.appendChild(slotEl);
    });
  } catch (err) {
    console.error("Error loading time slots:", err);
    clearChildren(dom.timeSlots);
    const msg = document.createElement("p");
    msg.textContent = "Couldn't load times for this date. Please try again.";
    dom.timeSlots.appendChild(msg);
  }
}

function handleSlotClick(time, slotEl) {
  document.querySelectorAll(".slot.selected").forEach(el => el.classList.remove("selected"));
  slotEl.classList.add("selected");
  showNameForm(time);
}

function removeFloatingPanels() {
  document.getElementById("confirmationMessage")?.remove();
  document.getElementById("bookingInfo")?.remove();
}

function showNameForm(time) {
  removeFloatingPanels();

  const container = document.createElement("div");
  container.id = "confirmationMessage";

  const heading = document.createElement("p");
  heading.textContent = `Ready to confirm booking for ${formatDateDisplay(currentDateInfo.date)} at ${formatTime12hr(time)}?`;

  const firstNameLabel = document.createElement("label");
  firstNameLabel.textContent = "First Name:";
  const firstNameInput = document.createElement("input");
  firstNameInput.type = "text";
  firstNameInput.placeholder = "Enter your first name";

  const lastNameLabel = document.createElement("label");
  lastNameLabel.textContent = "Last Name:";
  const lastNameInput = document.createElement("input");
  lastNameInput.type = "text";
  lastNameInput.placeholder = "Enter your last name";

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirm Booking";
  confirmBtn.addEventListener("click", () => {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    if (!firstName) { alert("Please enter your first name"); firstNameInput.focus(); return; }
    if (!lastName) { alert("Please enter your last name"); lastNameInput.focus(); return; }
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Booking...";
    submitBooking(currentDateInfo.date, time, firstName, lastName, confirmBtn);
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "cancel-btn";
  cancelBtn.addEventListener("click", () => {
    container.remove();
    document.querySelectorAll(".slot.selected").forEach(el => el.classList.remove("selected"));
  });

  container.append(heading, firstNameLabel, firstNameInput, lastNameLabel, lastNameInput, confirmBtn, cancelBtn);
  dom.timeSlots.parentElement.appendChild(container);
  firstNameInput.focus();
}

async function submitBooking(date, time, firstName, lastName, confirmBtn) {
  const id = slotId(date, time);
  try {
    await runTransaction(db, async (tx) => {
      const slotRef = doc(db, "takenSlots", id);
      const existing = await tx.get(slotRef);
      if (existing.exists()) throw new Error("SLOT_TAKEN");
      tx.set(slotRef, { date, time });
      tx.set(doc(db, "bookings", id), {
        date, time, firstName, lastName, createdAt: serverTimestamp()
      });
    });

    showBookingConfirmation(date, time);
    scheduleReminder(date, time);
  } catch (err) {
    if (err.message === "SLOT_TAKEN") {
      alert("Sorry, someone just booked that time. Pick another slot below.");
      selectDate(currentDateInfo);
    } else {
      console.error("Error submitting booking:", err);
      alert("Something went wrong submitting your booking. Please try again.");
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "Confirm Booking"; }
    }
  }
}

function showBookingConfirmation(date, time) {
  removeFloatingPanels();

  const messageContainer = document.createElement("div");
  messageContainer.id = "confirmationMessage";
  const message = document.createElement("p");
  message.textContent = `✓ Booking confirmed for ${formatDateDisplay(date)} at ${formatTime12hr(time)}`;
  messageContainer.appendChild(message);

  const infoContainer = document.createElement("div");
  infoContainer.id = "bookingInfo";
  const addressPara = document.createElement("p");
  addressPara.textContent = SHOP.address;
  addressPara.style.fontWeight = "bold";
  addressPara.style.fontSize = "1.1em";
  const directionsPara = document.createElement("p");
  directionsPara.textContent = SHOP.directions;
  directionsPara.style.marginTop = "15px";
  infoContainer.append(addressPara, directionsPara);

  dom.timeSlots.parentElement.append(messageContainer, infoContainer);

  // Refresh just the slot grid in the background so it reflects the new booking
  // (without wiping the confirmation panels we just added)
  renderSlotGrid(currentDateInfo);
}

// ---------------- best-effort reminder (only works while this tab stays open) ----------------

function scheduleReminder(date, time) {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  const [h, m] = time.split(":").map(Number);
  const appt = parseLocalDate(date);
  appt.setHours(h, m, 0, 0);
  const msUntilReminder = appt.getTime() - 45 * 60 * 1000 - Date.now();

  // Only schedule if the reminder time is in the future and not absurdly far off
  if (msUntilReminder > 0 && msUntilReminder < 1000 * 60 * 60 * 24 * 7) {
    setTimeout(() => {
      const body = `Your haircut appointment is in 45 minutes at ${formatTime12hr(time)}`;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("MFades Haircut Reminder", { body });
      }
      showInPageReminder(time);
    }, msUntilReminder);
  }
}

function showInPageReminder(time) {
  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";

  const box = document.createElement("div");
  box.className = "notification-box";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.className = "notification-close";
  closeBtn.addEventListener("click", () => overlay.remove());

  const title = document.createElement("h2");
  title.textContent = "⏰ Appointment Reminder";
  title.className = "notification-title";

  const message = document.createElement("p");
  message.textContent = `Your haircut appointment is in 45 minutes at ${formatTime12hr(time)}`;
  message.className = "notification-message";

  const address = document.createElement("p");
  address.textContent = SHOP.address;
  address.className = "notification-address";

  const okBtn = document.createElement("button");
  okBtn.textContent = "Got it!";
  okBtn.className = "notification-btn";
  okBtn.addEventListener("click", () => overlay.remove());

  box.append(closeBtn, title, message, address, okBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// ---------------- init ----------------

function init() {
  dom.dateCards = document.querySelector(SELECTORS.dateCards);
  dom.bookingSection = document.querySelector(SELECTORS.bookingSection);
  dom.selectedDate = document.querySelector(SELECTORS.selectedDate);
  dom.timeSlots = document.querySelector(SELECTORS.timeSlots);

  if (!dom.dateCards || !dom.bookingSection || !dom.selectedDate || !dom.timeSlots) {
    console.error("Required DOM elements not found");
    return;
  }

  loadAvailableDates();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Constants
const CSS_CLASSES = {
  dateCard: "date-card",
  slot: "slot",
  slotBooked: "booked",
  slotAvailable: "available",
  slotSelected: "selected"
};

const SELECTORS = {
  dateCards: "#dateCards",
  bookingSection: "#bookingSection",
  selectedDate: "#selectedDate",
  timeSlots: "#timeSlots"
};

// Booking data
const availableDays = {
  "June 17, 2026": {
    available: [
      "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
      "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
    ],
    booked: ["10:30 AM", "11:00 AM"]
  }
};

// DOM element cache with validation
const domElements = {
  dateCards: null,
  bookingSection: null,
  selectedDate: null,
  timeSlots: null,

  init() {
    this.dateCards = document.getElementById("dateCards");
    this.bookingSection = document.getElementById("bookingSection");
    this.selectedDate = document.getElementById("selectedDate");
    this.timeSlots = document.getElementById("timeSlots");

    if (!this.dateCards || !this.bookingSection || !this.selectedDate || !this.timeSlots) {
      throw new Error("Required DOM elements not found");
    }
  }
};

/**
 * Create a time slot element
 * @param {string} time - Time string
 * @param {boolean} isBooked - Whether the slot is booked
 * @returns {HTMLElement}
 */
function createTimeSlot(time, isBooked) {
  const slot = document.createElement("div");
  slot.className = `${CSS_CLASSES.slot} ${isBooked ? CSS_CLASSES.slotBooked : CSS_CLASSES.slotAvailable}`;
  slot.textContent = `${time} - ${isBooked ? "Booked" : "Available"}`;
  
  if (!isBooked) {
    slot.style.cursor = "pointer";
    slot.onclick = () => handleSlotClick(time, slot);
  }

  return slot;
}

/**
 * Handle time slot selection
 * @param {string} time - Selected time
 * @param {HTMLElement} slotElement - The slot element
 */
function handleSlotClick(time, slotElement) {
  // Remove previous selection
  document.querySelectorAll(`.${CSS_CLASSES.slot}.${CSS_CLASSES.slotSelected}`).forEach(el => {
    el.classList.remove(CSS_CLASSES.slotSelected);
  });

  // Mark selected slot
  slotElement.classList.add(CSS_CLASSES.slotSelected);
  console.log(`Selected time: ${time}`);
  // TODO: Submit booking to server
}

/**
 * Populate time slots for a selected date
 * @param {string} date - The date string
 */
function populateTimeSlots(date) {
  const dayData = availableDays[date];
  if (!dayData) return;

  domElements.timeSlots.innerHTML = "";
  domElements.selectedDate.textContent = date;

  // Show booked slots first (disabled)
  dayData.booked.forEach(time => {
    domElements.timeSlots.appendChild(createTimeSlot(time, true));
  });

  // Then available slots (clickable)
  dayData.available.forEach(time => {
    domElements.timeSlots.appendChild(createTimeSlot(time, false));
  });
}

/**
 * Create and append a date card
 * @param {string} date - The date string
 */
function createDateCard(date) {
  const card = document.createElement("div");
  card.className = CSS_CLASSES.dateCard;
  card.textContent = date;
  card.style.cursor = "pointer";

  card.onclick = () => {
    domElements.bookingSection.style.display = "block";
    populateTimeSlots(date);
  };

  domElements.dateCards.appendChild(card);
}

/**
 * Initialize the booking system
 */
function init() {
  domElements.init();
  
  for (const date in availableDays) {
    createDateCard(date);
  }
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

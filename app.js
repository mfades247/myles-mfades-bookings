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

// Booking location info
const BOOKING_INFO = {
  address: "2602 Marble Rd, Normal IL 61761",
  directions: "When you are here walk in 7 steps and it is on your left and go down the stairs"
};

// Booking state management
const bookingState = {
  selectedDate: null,
  selectedTime: null,

  /**
   * Set the current booking selection
   * @param {string} date - Selected date
   * @param {string} time - Selected time
   */
  setSelection(date, time) {
    if (typeof date !== 'string' || date.trim() === '') {
      console.error('Invalid date provided');
      return false;
    }
    if (typeof time !== 'string' || time.trim() === '') {
      console.error('Invalid time provided');
      return false;
    }
    this.selectedDate = date;
    this.selectedTime = time;
    return true;
  },

  /**
   * Clear the current booking selection
   */
  clear() {
    this.selectedDate = null;
    this.selectedTime = null;
  }
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
  confirmButton: null,

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
    slot.addEventListener('click', () => handleSlotClick(time, slot));
  }

  return slot;
}

/**
 * Submit booking to server
 * @param {string} date - The selected date
 * @param {string} time - The selected time
 */
async function submitBooking(date, time) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time })
    });
    
    if (!response.ok) {
      throw new Error(`Booking failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Booking submitted successfully:', result);
    
    // Show booking confirmation with location info
    showBookingConfirmation(date, time);
    bookingState.clear();
  } catch (error) {
    console.error('Error submitting booking:', error);
    alert('Failed to book appointment. Please try again.');
  }
}

/**
 * Show booking confirmation with location information
 * @param {string} date - The booked date
 * @param {string} time - The booked time
 */
function showBookingConfirmation(date, time) {
  // Remove any existing confirmation message
  const existingMessage = document.getElementById('confirmationMessage');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Remove any existing booking info
  const existingInfo = document.getElementById('bookingInfo');
  if (existingInfo) {
    existingInfo.remove();
  }

  // Create confirmation container
  const messageContainer = document.createElement('div');
  messageContainer.id = 'confirmationMessage';

  const message = document.createElement('p');
  message.textContent = `✓ Booking confirmed for ${date} at ${time}`;

  messageContainer.appendChild(message);
  domElements.timeSlots.parentElement.appendChild(messageContainer);

  // Create booking info container
  const infoContainer = document.createElement('div');
  infoContainer.id = 'bookingInfo';

  const addressPara = document.createElement('p');
  addressPara.textContent = BOOKING_INFO.address;
  addressPara.style.fontWeight = 'bold';
  addressPara.style.fontSize = '1.1em';

  const directionsPara = document.createElement('p');
  directionsPara.textContent = BOOKING_INFO.directions;
  directionsPara.style.marginTop = '15px';

  infoContainer.appendChild(addressPara);
  infoContainer.appendChild(directionsPara);
  domElements.timeSlots.parentElement.appendChild(infoContainer);
}

/**
 * Handle time slot selection
 * @param {string} time - Selected time
 * @param {HTMLElement} slotElement - The slot element
 */
function handleSlotClick(time, slotElement) {
  // Validate input
  if (!time || !slotElement) {
    console.error('Invalid time or slot element');
    return;
  }

  // Remove previous selection
  document.querySelectorAll(`.${CSS_CLASSES.slot}.${CSS_CLASSES.slotSelected}`).forEach(el => {
    el.classList.remove(CSS_CLASSES.slotSelected);
  });

  // Mark selected slot
  slotElement.classList.add(CSS_CLASSES.slotSelected);
  
  // Update booking state
  const selectedDate = domElements.selectedDate.textContent;
  bookingState.setSelection(selectedDate, time);
  
  console.log(`Selected time: ${time} on ${selectedDate}`);
  
  // Show confirmation message
  showConfirmationMessage(selectedDate, time);
}

/**
 * Show a confirmation message with confirm button
 * @param {string} date - The selected date
 * @param {string} time - The selected time
 */
function showConfirmationMessage(date, time) {
  // Remove any existing confirmation message
  const existingMessage = document.getElementById('confirmationMessage');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Remove any existing booking info
  const existingInfo = document.getElementById('bookingInfo');
  if (existingInfo) {
    existingInfo.remove();
  }

  // Create confirmation container
  const messageContainer = document.createElement('div');
  messageContainer.id = 'confirmationMessage';

  const message = document.createElement('p');
  message.textContent = `Ready to confirm booking for ${date} at ${time}?`;

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm Booking';
  confirmBtn.addEventListener('click', () => {
    submitBooking(date, time);
    messageContainer.remove();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.addEventListener('click', () => {
    messageContainer.remove();
    bookingState.clear();
    document.querySelectorAll(`.${CSS_CLASSES.slot}.${CSS_CLASSES.slotSelected}`).forEach(el => {
      el.classList.remove(CSS_CLASSES.slotSelected);
    });
  });

  messageContainer.appendChild(message);
  messageContainer.appendChild(confirmBtn);
  messageContainer.appendChild(cancelBtn);
  domElements.timeSlots.parentElement.appendChild(messageContainer);
}

/**
 * Populate time slots for a selected date
 * @param {string} date - The date string
 */
function populateTimeSlots(date) {
  // Validate date input
  if (typeof date !== 'string' || date.trim() === '') {
    console.error('Invalid date provided');
    domElements.timeSlots.innerHTML = '<p>Invalid date selected</p>';
    return;
  }

  const dayData = availableDays[date];
  if (!dayData) {
    domElements.timeSlots.innerHTML = '<p>No availability for this date</p>';
    console.warn(`No availability data for date: ${date}`);
    return;
  }

  domElements.timeSlots.innerHTML = "";
  domElements.selectedDate.textContent = date;

  // Show booked slots first (disabled)
  if (dayData.booked && dayData.booked.length > 0) {
    dayData.booked.forEach(time => {
      domElements.timeSlots.appendChild(createTimeSlot(time, true));
    });
  }

  // Then available slots (clickable)
  if (dayData.available && dayData.available.length > 0) {
    dayData.available.forEach(time => {
      domElements.timeSlots.appendChild(createTimeSlot(time, false));
    });
  } else {
    const noAvailableMsg = document.createElement('p');
    noAvailableMsg.textContent = 'No available slots for this date';
    domElements.timeSlots.appendChild(noAvailableMsg);
  }
}

/**
 * Create and append a date card
 * @param {string} date - The date string
 */
function createDateCard(date) {
  // Validate date input
  if (typeof date !== 'string' || date.trim() === '') {
    console.error('Invalid date provided to createDateCard');
    return;
  }

  const card = document.createElement("div");
  card.className = CSS_CLASSES.dateCard;
  card.textContent = date;
  card.style.cursor = "pointer";

  card.addEventListener('click', () => {
    domElements.bookingSection.style.display = "block";
    populateTimeSlots(date);
  });

  domElements.dateCards.appendChild(card);
}

/**
 * Initialize the booking system
 */
function init() {
  try {
    domElements.init();
    
    // Validate availableDays exists and is not empty
    if (!availableDays || Object.keys(availableDays).length === 0) {
      console.error('No available days configured');
      return;
    }

    // Create date cards for all available dates
    for (const date in availableDays) {
      if (availableDays.hasOwnProperty(date)) {
        createDateCard(date);
      }
    }
  } catch (error) {
    console.error('Error initializing booking system:', error);
    alert('Failed to initialize booking system. Please refresh the page.');
  }
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

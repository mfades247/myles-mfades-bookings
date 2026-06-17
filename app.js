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

// Booking data with expanded dates
const availableDays = {
  "June 17, 2026": {
    available: [
      "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
      "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
    ],
    booked: ["10:30 AM", "11:00 AM"]
  },
  "June 18, 2026": {
    available: [
      "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
      "11:30 AM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"
    ],
    booked: ["1:00 PM", "1:30 PM"]
  },
  "June 19, 2026": {
    available: [
      "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM",
      "12:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
    ],
    booked: ["2:00 PM"]
  },
  "June 20, 2026": {
    available: [
      "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
      "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
    ],
    booked: ["10:00 AM", "10:30 AM", "11:00 AM"]
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
    alert(`Booking confirmed for ${date} at ${time}`);
    bookingState.clear();
  } catch (error) {
    console.error('Error submitting booking:', error);
    alert('Failed to book appointment. Please try again.');
  }
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

  // Create confirmation container
  const messageContainer = document.createElement('div');
  messageContainer.id = 'confirmationMessage';
  messageContainer.style.cssText = 'margin-top: 20px; padding: 15px; background-color: #f0f8ff; border: 2px solid #4CAF50; border-radius: 5px;';

  const message = document.createElement('p');
  message.textContent = `Ready to confirm booking for ${date} at ${time}?`;
  message.style.margin = '0 0 10px 0';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm Booking';
  confirmBtn.style.cssText = 'background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
  confirmBtn.addEventListener('click', () => {
    submitBooking(date, time);
    messageContainer.remove();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'background-color: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;';
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

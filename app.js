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

// Admin credentials (you should change this to your actual password)
const ADMIN_PASSWORD = "DaiseyG2430!";
let isAdmin = false;

// Booking location info
const BOOKING_INFO = {
  address: "2602 Marble Rd, Normal IL 61761",
  directions: "When you are here walk in 7 steps and it is on your left and go down the stairs"
};

// Booking state management
const bookingState = {
  selectedDate: null,
  selectedTime: null,
  customerName: null,

  /**
   * Set the current booking selection
   * @param {string} date - Selected date
   * @param {string} time - Selected time
   * @param {string} name - Customer name
   */
  setSelection(date, time, name) {
    if (typeof date !== 'string' || date.trim() === '') {
      console.error('Invalid date provided');
      return false;
    }
    if (typeof time !== 'string' || time.trim() === '') {
      console.error('Invalid time provided');
      return false;
    }
    if (typeof name !== 'string' || name.trim() === '') {
      console.error('Invalid name provided');
      return false;
    }
    this.selectedDate = date;
    this.selectedTime = time;
    this.customerName = name;
    return true;
  },

  /**
   * Clear the current booking selection
   */
  clear() {
    this.selectedDate = null;
    this.selectedTime = null;
    this.customerName = null;
  }
};

// Booking data with customer names
let availableDays = {
  "June 17, 2026": {
    available: [
      "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
      "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
    ],
    booked: {
      "10:30 AM": "John Smith",
      "11:00 AM": "Sarah Johnson"
    }
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
 * Load bookings from localStorage
 */
function loadBookingsFromStorage() {
  const stored = localStorage.getItem('bookings');
  if (stored) {
    try {
      const bookings = JSON.parse(stored);
      // Merge stored bookings with availableDays
      for (const date in bookings) {
        if (availableDays[date]) {
          availableDays[date].booked = { ...availableDays[date].booked, ...bookings[date].booked };
          availableDays[date].available = availableDays[date].available.filter(t => !bookings[date].booked[t]);
        }
      }
    } catch (error) {
      console.error('Error loading bookings from storage:', error);
    }
  }
  
  // Schedule reminders for all booked appointments
  scheduleAllReminders();
}

/**
 * Save bookings to localStorage
 */
function saveBookingsToStorage() {
  const bookingsToSave = {};
  for (const date in availableDays) {
    bookingsToSave[date] = { booked: availableDays[date].booked };
  }
  localStorage.setItem('bookings', JSON.stringify(bookingsToSave));
}

/**
 * Request notification permission from user
 */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Convert time string (e.g., "1:00 PM") to 24-hour format
 * @param {string} time - Time in format "H:MM AM/PM"
 * @returns {object} { hours, minutes }
 */
function parseTime(time) {
  const parts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!parts) return null;
  
  let hours = parseInt(parts[1]);
  const minutes = parseInt(parts[2]);
  const meridiem = parts[3].toUpperCase();
  
  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string like "June 17, 2026"
 * @returns {Date}
 */
function parseDate(dateStr) {
  return new Date(dateStr);
}

/**
 * Schedule a reminder 45 minutes before appointment
 * @param {string} date - The appointment date
 * @param {string} time - The appointment time
 * @param {string} name - Customer name
 */
function scheduleReminder(date, time, name) {
  requestNotificationPermission();
  
  const appointmentDate = parseDate(date);
  const timeObj = parseTime(time);
  
  if (!timeObj) {
    console.error('Could not parse time:', time);
    return;
  }
  
  // Set appointment time
  appointmentDate.setHours(timeObj.hours);
  appointmentDate.setMinutes(timeObj.minutes);
  appointmentDate.setSeconds(0);
  
  // Calculate reminder time (45 minutes before)
  const reminderTime = new Date(appointmentDate.getTime() - 45 * 60 * 1000);
  
  // Store reminder in localStorage
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  reminders.push({
    date: date,
    time: time,
    name: name,
    appointmentTime: appointmentDate.toISOString(),
    reminderTime: reminderTime.toISOString(),
    notified: false
  });
  localStorage.setItem('reminders', JSON.stringify(reminders));
  
  console.log(`Reminder scheduled for ${date} at ${time} (${name}) - reminder at ${reminderTime}`);
  
  // Set up a check for this reminder
  checkAndNotify(reminders.length - 1);
}

/**
 * Schedule all reminders from bookings
 */
function scheduleAllReminders() {
  for (const date in availableDays) {
    const dayData = availableDays[date];
    if (dayData.booked && typeof dayData.booked === 'object') {
      for (const [time, name] of Object.entries(dayData.booked)) {
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const exists = reminders.some(r => r.date === date && r.time === time && r.name === name);
        if (!exists) {
          scheduleReminder(date, time, name);
        }
      }
    }
  }
}

/**
 * Check if it's time to notify and schedule next check
 * @param {number} reminderIndex - Index of reminder to check
 */
function checkAndNotify(reminderIndex) {
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  const reminder = reminders[reminderIndex];
  
  if (!reminder || reminder.notified) return;
  
  const now = new Date();
  const reminderTime = new Date(reminder.reminderTime);
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  if (timeUntilReminder <= 0) {
    // Time to notify!
    sendNotification(reminder);
    reminder.notified = true;
    reminders[reminderIndex] = reminder;
    localStorage.setItem('reminders', JSON.stringify(reminders));
  } else {
    // Schedule next check (check every minute, or right before time)
    const delayMs = Math.min(timeUntilReminder, 60000);
    setTimeout(() => checkAndNotify(reminderIndex), delayMs);
  }
}

/**
 * Send notification to user
 * @param {object} reminder - Reminder object
 */
function sendNotification(reminder) {
  const message = `Reminder: You have an appointment at ${reminder.time}`;
  
  // Try browser notification first
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('MFades Haircut Reminder', {
      body: message,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23333"/><path d="M30 55 Q30 50 50 50 Q70 50 70 55 L70 85 Q70 90 65 90 L35 90 Q30 90 30 85 Z" fill="%23333"/></svg>',
      tag: `appointment-${reminder.date}-${reminder.time}`,
      requireInteraction: true
    });
  }
  
  // Also show in-page notification
  showInPageNotification(reminder);
}

/**
 * Show in-page notification modal
 * @param {object} reminder - Reminder object
 */
function showInPageNotification(reminder) {
  const overlay = document.createElement('div');
  overlay.className = 'notification-overlay';
  overlay.id = `notification-${reminder.date}-${reminder.time}`;
  
  const notificationBox = document.createElement('div');
  notificationBox.className = 'notification-box';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.className = 'notification-close';
  closeBtn.addEventListener('click', () => overlay.remove());
  
  const title = document.createElement('h2');
  title.textContent = '⏰ Appointment Reminder';
  title.className = 'notification-title';
  
  const message = document.createElement('p');
  message.textContent = `Your haircut appointment is in 45 minutes at ${reminder.time}`;
  message.className = 'notification-message';
  
  const address = document.createElement('p');
  address.textContent = BOOKING_INFO.address;
  address.className = 'notification-address';
  
  const okBtn = document.createElement('button');
  okBtn.textContent = 'Got it!';
  okBtn.className = 'notification-btn';
  okBtn.addEventListener('click', () => overlay.remove());
  
  notificationBox.appendChild(closeBtn);
  notificationBox.appendChild(title);
  notificationBox.appendChild(message);
  notificationBox.appendChild(address);
  notificationBox.appendChild(okBtn);
  
  overlay.appendChild(notificationBox);
  document.body.appendChild(overlay);
}

/**
 * Check if user is admin
 */
function checkAdminAccess() {
  const password = prompt("Enter admin password to view customer names:");
  if (password === ADMIN_PASSWORD) {
    isAdmin = true;
    alert("Admin access granted!");
  } else if (password !== null) {
    alert("Invalid password");
  }
}

/**
 * Create a time slot element
 * @param {string} time - Time string
 * @param {boolean} isBooked - Whether the slot is booked
 * @param {string} customerName - Name of customer (if booked)
 * @returns {HTMLElement}
 */
function createTimeSlot(time, isBooked, customerName) {
  const slot = document.createElement("div");
  slot.className = `${CSS_CLASSES.slot} ${isBooked ? CSS_CLASSES.slotBooked : CSS_CLASSES.slotAvailable}`;
  
  if (isBooked) {
    // Show customer name only if admin
    if (isAdmin && customerName) {
      slot.textContent = `${time} - Booked (${customerName})`;
    } else {
      slot.textContent = `${time} - Booked`;
    }
  } else {
    slot.textContent = `${time} - Available`;
  }
  
  if (!isBooked) {
    slot.style.cursor = "pointer";
    slot.addEventListener('click', () => handleSlotClick(time, slot));
  }

  return slot;
}

/**
 * Submit booking to localStorage
 * @param {string} date - The selected date
 * @param {string} time - The selected time
 * @param {string} firstName - Customer first name
 * @param {string} lastName - Customer last name
 */
function submitBooking(date, time, firstName, lastName) {
  try {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    
    // Validate name
    if (!fullName || fullName.length < 2) {
      alert('Please enter both first and last name');
      return;
    }
    
    // Update local data
    if (!availableDays[date]) {
      availableDays[date] = { available: [], booked: {} };
    }
    
    if (typeof availableDays[date].booked !== 'object' || Array.isArray(availableDays[date].booked)) {
      availableDays[date].booked = {};
    }
    
    // Add booking
    availableDays[date].booked[time] = fullName;
    availableDays[date].available = availableDays[date].available.filter(t => t !== time);
    
    // Save to localStorage
    saveBookingsToStorage();
    
    // Schedule reminder for this appointment
    scheduleReminder(date, time, fullName);
    
    console.log('Booking submitted successfully:', { date, time, name: fullName });
    
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
  
  console.log(`Selected time: ${time} on ${selectedDate}`);
  
  // Show confirmation message with name input
  showConfirmationMessage(selectedDate, time);
}

/**
 * Show a confirmation message with name input and confirm button
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

  // Create first name input
  const firstNameLabel = document.createElement('label');
  firstNameLabel.textContent = 'First Name:';
  firstNameLabel.style.marginTop = '15px';

  const firstNameInput = document.createElement('input');
  firstNameInput.type = 'text';
  firstNameInput.placeholder = 'Enter your first name';
  firstNameInput.id = 'customerFirstName';
  firstNameInput.style.marginBottom = '10px';

  // Create last name input
  const lastNameLabel = document.createElement('label');
  lastNameLabel.textContent = 'Last Name:';
  lastNameLabel.style.marginTop = '15px';

  const lastNameInput = document.createElement('input');
  lastNameInput.type = 'text';
  lastNameInput.placeholder = 'Enter your last name';
  lastNameInput.id = 'customerLastName';
  lastNameInput.style.marginBottom = '15px';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm Booking';
  confirmBtn.addEventListener('click', () => {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    
    if (!firstName) {
      alert('Please enter your first name');
      firstNameInput.focus();
      return;
    }
    if (!lastName) {
      alert('Please enter your last name');
      lastNameInput.focus();
      return;
    }
    
    const fullName = `${firstName} ${lastName}`;
    if (bookingState.setSelection(date, time, fullName)) {
      submitBooking(date, time, firstName, lastName);
      messageContainer.remove();
    }
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
  messageContainer.appendChild(firstNameLabel);
  messageContainer.appendChild(firstNameInput);
  messageContainer.appendChild(lastNameLabel);
  messageContainer.appendChild(lastNameInput);
  messageContainer.appendChild(confirmBtn);
  messageContainer.appendChild(cancelBtn);
  domElements.timeSlots.parentElement.appendChild(messageContainer);

  // Focus on first name input
  firstNameInput.focus();
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
  if (dayData.booked) {
    if (typeof dayData.booked === 'object' && !Array.isArray(dayData.booked)) {
      // New format: object with times as keys and names as values
      for (const [time, name] of Object.entries(dayData.booked)) {
        domElements.timeSlots.appendChild(createTimeSlot(time, true, name));
      }
    }
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
    
    // Load bookings from localStorage
    loadBookingsFromStorage();
    
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

    // Add admin button
    const adminBtn = document.createElement('button');
    adminBtn.textContent = 'Admin Panel';
    adminBtn.id = 'adminBtn';
    adminBtn.style.position = 'fixed';
    adminBtn.style.bottom = '20px';
    adminBtn.style.right = '20px';
    adminBtn.style.zIndex = '1000';
    adminBtn.addEventListener('click', checkAdminAccess);
    document.body.appendChild(adminBtn);
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

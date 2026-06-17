```javascript
const availableDays = {
  "June 17, 2026": {
    available: [
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
      "6:00 PM"
    ],
    booked: [
      "10:30 AM",
      "11:00 AM"
    ]
  }
};

const dateCards = document.getElementById("dateCards");
const bookingSection = document.getElementById("bookingSection");
const selectedDate = document.getElementById("selectedDate");
const timeSlots = document.getElementById("timeSlots");

dateCards.innerHTML = "";

Object.keys(availableDays).forEach(date => {
  const card = document.createElement("div");

  card.className = "date-card";
  card.textContent = date;

  card.addEventListener("click", () => {

    bookingSection.style.display = "block";
    selectedDate.textContent = date;
    timeSlots.innerHTML = "";

    // Show booked times first
    availableDays[date].booked.forEach(time => {
      const slot = document.createElement("div");

      slot.className = "slot booked";
      slot.textContent = `${time} - Booked`;

      timeSlots.appendChild(slot);
    });

    // Show available times
    availableDays[date].available.forEach(time => {
      const slot = document.createElement("div");

      slot.className = "slot";
      slot.textContent = `${time} - Available`;

      slot.addEventListener("click", () => {
        document
          .querySelectorAll(".slot")
          .forEach(s => s.classList.remove("selected"));

        slot.classList.add("selected");
      });

      timeSlots.appendChild(slot);
    });

  });

  dateCards.appendChild(card);
});
```

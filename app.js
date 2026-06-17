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
      "5:00 PM"
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

// Create clickable date cards
for (const date in availableDays) {

  const card = document.createElement("button");

  card.innerText = date;
  card.className = "date-card";

  card.onclick = function () {

    bookingSection.style.display = "block";
    selectedDate.innerText = date;

    timeSlots.innerHTML = "";

    availableDays[date].booked.forEach(time => {
      const div = document.createElement("div");
      div.className = "slot booked";
      div.innerText = `${time} - Booked`;
      timeSlots.appendChild(div);
    });

    availableDays[date].available.forEach(time => {
      const div = document.createElement("div");
      div.className = "slot";
      div.innerText = `${time} - Available`;
      timeSlots.appendChild(div);
    });

  };

  dateCards.appendChild(card);
}
```

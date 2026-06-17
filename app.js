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

dateCards.innerHTML = "";

Object.keys(availableDays).forEach(date => {

const card = document.createElement("div");

card.className = "date-card";
card.textContent = date;

card.addEventListener("click", () => {

```
bookingSection.style.display = "block";

selectedDate.textContent = date;

timeSlots.innerHTML = "";

availableDays[date].booked.forEach(time => {

  const slot = document.createElement("div");

  slot.className = "slot booked";

  slot.textContent = `${time} - Booked`;

  timeSlots.appendChild(slot);

});

availableDays[date].available.forEach(time => {

  const slot = document.createElement("div");

  slot.className = "slot";

  slot.textContent = `${time} - Available`;

  timeSlots.appendChild(slot);

});
```

});

dateCards.appendChild(card);

});

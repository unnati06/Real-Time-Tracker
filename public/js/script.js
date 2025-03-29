document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([0, 0], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Sheryians Coding School"
    }).addTo(map);

    const socket = io();
    const markers = {};

    // Track and mark user's current location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                socket.emit("send-location", { latitude, longitude });
                map.setView([latitude, longitude], 13); // Center on user

                // Add or update user's marker
                const userId = socket.id;
                if (markers[userId]) {
                    markers[userId].setLatLng([latitude, longitude]);
                } else {
                    markers[userId] = L.marker([latitude, longitude])
                        .addTo(map)
                        .bindPopup("You are here");
                }
            },
            (error) => console.log(error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }

    // Receive and display other users' locations
    socket.on("receive-location", (data) => {
        const { id, latitude, longitude } = data;
        if (id !== socket.id) { // Only mark other users
            if (markers[id]) {
                markers[id].setLatLng([latitude, longitude]);
            } else {
                markers[id] = L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup(`User ${id}`);
            }
        }
    });

    // Remove disconnected users
    socket.on("user-disconnected", (id) => {
        if (markers[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });

    // Function to track a place by name
    window.trackPlace = async () => {
        const place = document.getElementById("place").value.trim();
        if (!place) {
            alert("Please enter a place name.");
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
            );
            const data = await response.json();

            if (data.length > 0) {
                const { lat, lon } = data[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);

                const placeId = "place";
                if (markers[placeId]) {
                    markers[placeId].setLatLng([latitude, longitude]);
                } else {
                    markers[placeId] = L.marker([latitude, longitude])
                        .addTo(map)
                        .bindPopup(place);
                }
                map.setView([latitude, longitude], 13); // Center on the place
            } else {
                alert("Place not found.");
            }
        } catch (error) {
            console.error("Error fetching place:", error);
            alert("Failed to find the place. Try again.");
        }
    };
});
let map = L.map('map').setView([28.6139,77.2090], 12);
let routeLayer = null;
let markers = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Voice input
function startVoiceInput(){
    const rec = new webkitSpeechRecognition();
    rec.start();
    rec.onresult = e=>{
        document.getElementById("textInput").value = e.results[0][0].transcript;
    };
}

// Text-to-speech
function speakText(text){
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

// Demo image analysis
function analyzeImage(){
    const file = document.getElementById("imageInput").files[0];
    if(!file){ alert("Select image first"); return; }
    document.getElementById("imageResult").innerText = "Detected: Landmark / Tourist place";
}

// Demo translation & sentiment
async function translateText(text){
    const lang = document.getElementById("languageSelect").value;
    // Here you can use your TranslatorKey & Endpoint if needed
    return "Translated ("+lang+"): "+text;
}
function analyzeLanguage(){ return "Sentiment: Positive"; }

// Analyze all
async function analyzeAll(){
    const text = document.getElementById("textInput").value;
    document.getElementById("summary").innerText = "Summary: "+text.substring(0,80)+"...";
    document.getElementById("sentiment").innerText = analyzeLanguage();
    const t = await translateText(text);
    document.getElementById("translation").innerText = t;
    speakText(t);
}

// Add marker
function addMarker(latlng,title){
    const m = L.marker(latlng,{riseOnHover:true}).addTo(map).bindPopup(title);
    markers.push(m);
}

// Clear map
function clearMap(){
    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(routeLayer) map.removeLayer(routeLayer);
}

// Distance
function getDistance(c1,c2){
    const R=6371;
    const dLat=(c2[0]-c1[0])*Math.PI/180;
    const dLon=(c2[1]-c1[1])*Math.PI/180;
    const a=Math.sin(dLat/2)**2 + Math.cos(c1[0]*Math.PI/180)*Math.cos(c2[0]*Math.PI/180)*Math.sin(dLon/2)**2;
    const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R*c;
}

// Current location
function getCurrentLocation(){
    navigator.geolocation.getCurrentPosition(pos=>{
        const lat=pos.coords.latitude, lng=pos.coords.longitude;
        map.setView([lat,lng],14);
        addMarker([lat,lng],"You are here");
        document.getElementById("start").value = lat+","+lng;
    });
}

// Convert place name to lat,lng using Nominatim
async function geocodePlace(place){
    try{
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
        const data = await res.json();
        if(data && data.length>0){
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else { alert("Location not found: "+place); return null; }
    } catch(err){ alert("Error geocoding: "+place); return null; }
}

// Show route & nearby places
async function showRouteAndPlaces(){
    clearMap();
    const startText=document.getElementById("start").value;
    const destText=document.getElementById("destination").value;
    const type=document.getElementById("placeType").value;

    const start = startText.includes(",") ? startText.split(",").map(Number) : await geocodePlace(startText);
    const dest = destText.includes(",") ? destText.split(",").map(Number) : await geocodePlace(destText);

    if(!start || !dest) return;

    addMarker(start,"Start");
    addMarker(dest,"Destination");
    map.fitBounds([start,dest]);

    // Draw route
    routeLayer = L.polyline([start,dest],{color:"blue"}).addTo(map);
    const dist = getDistance(start,dest).toFixed(2);
    alert("Distance: "+dist+" km");

    // Simulated nearby places
    const places=[
        {name:type+" 1", coords:[dest[0]+0.005,dest[1]+0.005]},
        {name:type+" 2", coords:[dest[0]-0.005,dest[1]+0.005]},
        {name:type+" 3", coords:[dest[0]+0.005,dest[1]-0.005]},
    ];

    const list=document.getElementById("placesList");
    list.innerHTML="";
    places.forEach(p=>{
        addMarker(p.coords,p.name);
        const d = getDistance(dest,p.coords).toFixed(2);
        const li=document.createElement("li");
        li.innerHTML=`<b>${p.name}</b> 📏 ${d} km`;
        li.onclick=()=>map.setView(p.coords,16);
        list.appendChild(li);
    });
}
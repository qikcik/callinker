
extension = prompt("Podaj numer stanowiska", "");
socket = io.connect('http://locktelbochnia.dyndns.org:7777/');


socket.on( 'connect', () => {
    console.log( 'connected to server' );
    socket.emit('login',extension);
});

socket.on("logged", (result) => {
    extension = result;
    document.getElementById("oncall-general-extension").innerHTML = result;
    alert(`połączono do stanowiska ${extension}`);
});

socket.on("answered", (result) => {
    
    document.getElementById("oncall-general-caller").innerHTML = result.caller;
    document.getElementById("oncall-orders").innerHTML = "";
    for (i in result.orders) {
        let order = result.orders[i];
        document.getElementById("oncall-orders").innerHTML += 
        `
            <a class="oncall-order" href="https://panel.baselinker.com/orders.php#order:${order._id}">
                <div class="field">
                        <div class="label">id</div> 
                        <div id="oncall-general-extension" class="property">${order._id}</div>
                </div>
                <div class="field">
                        <div class="label">data zamówienia:</div> 
                        <div id="oncall-general-extension" class="property">${timeConverter(order.date_add)}</div>
                </div>
                <div class="field">
                        <div class="label">potwierdzona:</div> 
                        <div id="oncall-general-extension" class="property">${order.confirmed ? 'tak': 'nie'}</div>
                </div>
            </a>
        `;
    }

});

socket.on("hangup", (result) => {
    document.getElementById("oncall-general-caller").innerHTML = "";
    document.getElementById("oncall-orders").innerHTML = "";
});

socket.on("error", (result) => {

});

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}
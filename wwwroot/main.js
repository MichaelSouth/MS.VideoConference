const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let stream;

console.log("Add load event callback");
window.addEventListener("load", async function (evt) {
    console.log("Load event fired");

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        return;
    }

    // List cameras and microphones.
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            
            devices.forEach(function (device) {
                console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
                if (device.kind === "videoinput") {
                    var option = document.createElement("option");
                    option.value = device.deviceId;
                    option.text = device.label;
                    devicesCombo.add(option);
                }
            });
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });
});

async function StartStream() {
    console.log("StartStream clicked");

    const devicesCombo = document.getElementById('devicesCombo');
    if (devicesCombo.length === 0) {
        console.log("No devices found.");
        alert("No devices found.");
        return;
    }

    const deviceId = devicesCombo.options[devicesCombo.selectedIndex].value;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: deviceId } });
        /* use the stream */
        var video = document.getElementById('localVideo');
        video.srcObject = stream;
    } catch (err) {
        /* handle the error */
        console.log("The following error occurred: " + err.name);
    }
}

function CreateCall() {
    console.log("CreateCall clicked");

    if (stream) {
        var peerConnection = new RTCPeerConnection(servers);
        peerConnection.addStream(stream);

        var offerDescription = peerConnection.createOffer();
        console.log("Offer created");
        console.log(offerDescription);
        peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        // TODO send the offer to a server to be forwarded to the other peer
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };
    }
    else {
        console.log("No stream.");
        alert("No stream.");
    }
}

function Answer() {
    console.log("Answer clicked");
}
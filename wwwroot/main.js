let peerConnection
let stream;
let latestOffer;

const localClientId = uuidv4();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

Initialise();

function Initialise() {
    console.log("Initialise");
    console.log("clientId =" + localClientId);

    GetOffers();

    window.addEventListener("load", async function (evt) {
        console.log("Load event fired");

        peerConnection = new RTCPeerConnection(servers);
        peerConnection.onicecandidate = handleICECandidateEvent;
        peerConnection.ontrack = handleTrackEvent;
        peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
        peerConnection.onremovetrack = handleRemoveTrackEvent;
        peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
        peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
        peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;

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
}

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
        peerConnection.addStream(stream);
    } catch (err) {
        /* handle the error */
        console.log("The following error occurred: " + err.name);
    }
}

async function CreateCall() {
    console.log("CreateCall clicked");

    if (stream) {

        var offerDescription = await peerConnection.createOffer();
        console.log("Offer created");
        console.log(offerDescription);
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };
        peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        // TODO send the offer to a server to be forwarded to the other peer
        const params = {
            clientId: localClientId,
            offer: offer
        };

        //const data = new URLSearchParams();
        //data.append('clientId', localClientId );
        //data.append('offer', offer);

        let response = fetch('/Signal/CreateOffer', {
            method: 'post',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(params)
        }).then((data) => {
            if (!data.ok) {
                throw data;
            }
            console.log("Offer posted ");
        })
    }
    else {
        console.log("No stream.");
        alert("No stream.");
    }
}

async function Answer() {
    console.log("Answer clicked");

    if (latestOffer) {
        console.log("Answering: " + latestOffer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(latestOffer));

        peerConnection.addStream(stream);

        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };
    } else {
        console.log("No offer to answer.");
        alert("No offer to answer.");
    }
}

function GetOffers() {
    console.info('GetOffers');
    const params = {
        clientId: localClientId
    };
    const url = '/Signal/GetOffers/?' + (new URLSearchParams(params)).toString();
    fetch(url)
        //.then(CheckError)
        .then(response => response.json())
        .then(data => {
            console.log(data);

            for (let i = 0; i < data.length; i++) {
                const offer = data[i];

                console.log(offer.label);
                latestOffer = offer;
            }

            this.window.setTimeout(GetOffers, 2000);
        }).catch((error) => {
            // Handle the error
            console.log(error);
        });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function handleICECandidateEvent(event) {
    console.log("handleICECandidateEvent called: "+event);
}

function handleTrackEvent(event) {
    console.log("handleTrackEvent called: " + event);

    document.getElementById("receivedVideo").srcObject = event.streams[0];
}

function handleNegotiationNeededEvent(event) {
    console.log("handleNegotiationNeededEvent called: " + event);
}

function handleRemoveTrackEvent(event) {
    console.log("handleRemoveTrackEvent called: " + event);
}

function handleICEConnectionStateChangeEvent(event) {
    console.log("handleICEConnectionStateChangeEvent called: " + event);
}

function handleICEGatheringStateChangeEvent(event) {
    console.log("handleICEGatheringStateChangeEvent called: " + event);
}

function handleSignalingStateChangeEvent(event) {
    console.log("handleSignalingStateChangeEvent called: " + event);
}
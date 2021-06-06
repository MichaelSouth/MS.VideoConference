let peerConnection = null;
let localStream = null;
let remoteStream = null;
let iceMessages = [];
let latestAnswer = null;

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

    //const params = {
    //    clientId: localClientId,
    //    candidate: JSON.stringify('test')
    //};

    //let response = fetch('/Signal/SendCandidate', {
    //    method: 'post',
    //    headers: {
    //        "Content-type": "application/json"
    //    },
    //    body: JSON.stringify(params)
    //}).then((data) => {
    //    if (!data.ok) {
    //        throw data;
    //    }
    //    console.log("Candidate posted ");
    //})

    GetMessages();

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
        peerConnection.onstatsended = handleStatSended ;
   
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices() not supported.");
            return;
        }

        // List cameras and microphones.
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) {

                devices.forEach(function (device) {
                    console.log(device);
                    if (device.kind === "videoinput") {
                        var option = document.createElement("option");
                        option.value = device.deviceId;
                        option.text = device.label;
                        devicesCombo.add(option);
                    }
                });
            })
            .catch(function (err) {
                console.log(err);
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
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: deviceId } });
        remoteStream = new MediaStream();
        /* use the stream */
        var video = document.getElementById('localVideo');
        video.srcObject = localStream;

        document.getElementById('receivedVideo').srcObject = remoteStream;

        localStream.getTracks().forEach(function (track) {
            peerConnection.addTrack(track, localStream);
        });
    } catch (err) {
        /* handle the error */
        console.log("The following error occurred: " + err.name);
    }
}

async function CreateCall() {
    console.log("CreateCall clicked");

    if (localStream) {

        var offer = await peerConnection.createOffer();
        console.log("Set Local Description: ", offer);
        await peerConnection.setLocalDescription(offer).catch((error) => {
            // Handle the error
            console.error(error);
        });;

        // Send the offer to the signalling server to be forwarded to the other peer
        const params = {
            clientId: localClientId,
            type: 'offer',
            data: JSON.stringify(offer)
        };

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
            alert("Create call success." + offer);
        })
    }
    else {
        console.log("No stream.");
        alert("No stream.");
    }
}

async function GetMessages() {
    //console.info('GetOffers');
    const params = {
        clientId: localClientId
    };
    const url = '/Signal/GetMessages/?' + (new URLSearchParams(params)).toString();
    fetch(url)
        //.then(CheckError)
        .then(response => response.json())
        .then(async data => {
            //console.log(data);

            if (data.length > 0) {
                console.log("Messages Received Count: ", data.length);
            }

            for (let i = 0; i < data.length; i++) {
                const message = data[i];
                console.log("Message Received: ", message);

                if (message.type === "offer") {
                    const latestOffer = JSON.parse(message.data);
                    console.log("Set Remote Description: ", latestOffer);
                    await peerConnection.setRemoteDescription(latestOffer).catch((error) => {
                        // Handle the error
                        console.error(error);
                    });;

                    const answerDescription = await peerConnection.createAnswer().catch((error) => {
                        // Handle the error
                        console.error(error);
                    });;

                    console.log("Set Local Description: ", answerDescription);
                    await peerConnection.setLocalDescription(answerDescription).catch((error) => {
                        // Handle the error
                        console.error(error);
                    });;

                    const answer = {
                        type: answerDescription.type,
                        sdp: answerDescription.sdp,
                    };

                    // Send the answer to the signalling server to be forwarded to the other peer
                    const params = {
                        clientId: localClientId,
                        type: 'answer',
                        data: JSON.stringify(answer)
                    };

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
                        console.log("Answer posted ");
                    })
                }
                if (message.type === "answer") {
                    console.log("Set latest answer to: ", message);
                    latestAnswer = JSON.parse(message.data);
                    await peerConnection.setRemoteDescription(latestAnswer).catch((error) => {
                        // Handle the error
                        console.error(error);
                    });
                }

                if (message.type === "candidate") {
                    iceMessages.push(message);
                }
            }

            //Hack add the ice candidates after
            if (latestAnswer === null) {
                for (let i = 0; i < iceMessages.length; i++) {
                    const candidate = iceMessages[i].data;
                    console.log("Process candidate: ", candidate);

                    let temp = JSON.parse(candidate);
                    let iceCandidate = new RTCIceCandidate(temp);
                    await peerConnection.addIceCandidate(iceCandidate).catch((error) => {
                        // Handle the error
                        console.error(error);
                    });;
                }

                //Clear queue
                iceMessages = [];
            }

            this.window.setTimeout(GetMessages, 2000);
        }).catch((error) => {
            // Handle the error
            console.error(error);
        });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function handleICECandidateEvent(event) {
    console.log("handleICECandidateEvent called: " , event);

   // event.candidate && offerCandidates.add(event.candidate.toJSON());
    if (event.candidate) {
        // Send the candidate to the signalling server to be forwarded to the other peer
        const params = {
            clientId: localClientId,
            type: 'candidate',
            data: JSON.stringify(event.candidate.toJSON())
        };

        let response = fetch('/Signal/SendCandidate', {
            method: 'post',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(params)
        }).then((data) => {
            if (!data.ok) {
                throw data;
            }
            console.log("Candidate posted ");
        })
    }
}

function handleTrackEvent(event) {
    console.log("handleTrackEvent called: " , event);

    //document.getElementById("receivedVideo").srcObject = event.streams[0];
    event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
    });
}

function handleNegotiationNeededEvent(event) {
    console.log("handleNegotiationNeededEvent called: " , event);
}

function handleRemoveTrackEvent(event) {
    console.log("handleRemoveTrackEvent called: " , event);
}

function handleICEConnectionStateChangeEvent(event) {
    console.log("handleICEConnectionStateChangeEvent called: " , event);
}

function handleICEGatheringStateChangeEvent(event) {
    console.log("handleICEGatheringStateChangeEvent called: " , event);
}

function handleSignalingStateChangeEvent(event) {
    console.log("handleSignalingStateChangeEvent called: " , event);
}

function handleStatSended(event) {
    console.log("handleStatSended called: " , event);
}
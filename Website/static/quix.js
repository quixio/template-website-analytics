const base_url = 'https://docs-api-quix-quixdocsanalytics-main.deployments.quix.io';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getSessionId() {
    let key = 'quixDocsSessionId';
    let sessionId = localStorage.getItem(key);

    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem(key, sessionId);
    }

    return sessionId;
}

const sessionId = getSessionId();
console.log('Session ID:', sessionId);

async function publishData(events) {
    if (!sessionId) return;
    const url = base_url + '/publish';
    const data = {
        sessionId: sessionId,
        events: events
    };

    const jsonString = JSON.stringify(data);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonString
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);
    } catch (error) {
        console.error('Error publishing action:', error);
    }
}

let eventData = {
    sessionId: sessionId,
    events: []
};

let lastEventTime = 0;

function trackEvent(event) {
    const target = event.target;
    const tag = target.tagName;
    const callerId = target.id;
    const mouseX = event.screenX;
    const mouseY = event.screenY;
    const documentWidth = document.documentElement.scrollWidth;
    const documentHeight = document.documentElement.scrollHeight;

    function elementInnerHtmlSnippet(element) {
        try {
            const value = element.innerHTML;
            const first100Chars = value.substring(0, 100);
            const cleaned = first100Chars.replace(/\s+/g, ' ').trim();
            return cleaned;
        } catch (error) {
            return undefined;
        }
    }

    function elementInnerText(element) {
        try {
            const value = element.innerText;
            const first100Chars = value.substring(0, 100);
            const cleaned = first100Chars.replace(/\s+/g, ' ').trim();
            return cleaned;
        } catch (error) {
            return undefined;
        }
    }

    targetInnerText = elementInnerText(target);
    targetHtmlSnippet = elementInnerHtmlSnippet(target);
    parentHtmlSnippet = elementInnerHtmlSnippet(target.parentElement);
    childHtmlSnippet = elementInnerHtmlSnippet(target.firstElementChild);

    payload = {
        "type": event.type,
        "server": window.location.origin,
        "relative_path": window.location.pathname,
        "query_prams": window.location.search,
        "buttons": event.buttons,
        "element": {
            "id": callerId,
            "tag": tag,
            "text": targetInnerText
        },
        "window": {
            "width": documentWidth,
            "height": documentHeight,
        },
        "mouse-coordinates": {
            "x": mouseX,
            "y": mouseY
        }
    }

    eventData.events.push(payload);
}

document.addEventListener('mouseover', (e) => {
    const currentTime = Date.now();
    if (currentTime - lastEventTime >= 1000) {
        trackEvent(e);
        lastEventTime = currentTime;
    }
});
document.addEventListener('click', trackEvent);

const sendDelay = 2;
setInterval(function() {
    if (eventData.events.length > 0) {
        publishData(eventData.events);
        eventData.events = [];
    }
}, sendDelay * 1000);

window.addEventListener('beforeunload', function(event) {
    publishData(eventData.events);
});

let msg = new SpeechSynthesisUtterance();
let operatingSystem
let voices
let voiceNum
let posts = []
let prevPosts = []
let bufferNumber = 5
let maxBuffer
let urlExpression = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
let emoteExpression = /!+[\[]+(img)+[\]]+[(]+(emote\|)+(\w*)+[\|]+(\d*)+[\)]/gmis
let urlRegex = new RegExp(urlExpression);
let emoteRegex = new RegExp(emoteExpression)
let playing = false
let playButton = document.getElementById('playButton')
let stopButton = document.getElementById('stopButton')
let skipButton = document.getElementById('skipButton')
let placeholder = document.getElementById('placeholder')
let hackResume
let debugCounter = 0
let threadLinkUrl

let pitch = 1 // between .1 and 2
let speed = 1 //between .1 and 2
let volume = 1 // between 0 and 1



function play(){

    let hasEnabledVoice = false;

    document.addEventListener('click', () => {
    if (hasEnabledVoice) {
        return;
    }
    const lecture = new SpeechSynthesisUtterance('hello');
    lecture.volume = 0;
    speechSynthesis.speak(lecture);
    hasEnabledVoice = true;
    });

    let wsbUrl = new Request('https://www.reddit.com/r/wallstreetbets/.json')
    let wsbDDthread

    playing = true
    stopButton.classList.remove('d-none')
    playButton.classList.add('d-none')
    skipButton.classList.remove('d-none')
    placeholder.classList.remove('d-none')

    fetch(wsbUrl)
    .then(data=>{return data.json()})
    .then(res=>{    
        wsbDDthread = new Request(res.data.children[0].data.url + '.json')
        threadLinkUrl = wsbDDthread.url
        threadLinkUrl = threadLinkUrl.replace('.json', '')
        document.getElementById("threadLink").setAttribute("href",threadLinkUrl);
        document.getElementById("threadLink").innerHTML = 'Link to thread';
        fetch(wsbDDthread)
        .then(data=>{return data.json()})
        .then(res=>{
            console.log(res[1].data.children.length)
            maxBuffer = res[1].data.children.length - 2;
            if(bufferNumber > maxBuffer){
                bufferNumber = maxBuffer
            }
            for (let i = bufferNumber; i > 0; i--){
                let tard = res[1].data.children[i].data.author
                let body = res[1].data.children[i].data.body
                let commenturl = 'http://www.reddit.com'+res[1].data.children[i].data.permalink
                //remove links/emotes from body
                if (body.match(urlRegex)){
                    body = body.replace(urlRegex, '')
                }
                if (body.match(emoteRegex)){
                    body = body.replace(emoteRegex, '')
                }
                posts.push({author: tard, comment: body, commentLink: commenturl});
                
            }
            voice();           
        })
        .catch(error=>console.log(error + ' error loading thread')) 
    })
    .catch(error=>console.log(error + ' error loading wsb'))
    
    
}
async function voice(){
    
    //check duplicates
    let previousComments = new Set(prevPosts.map(post => post.comment));
    let filterd = posts.filter(post => !previousComments.has(post.comment))

    prevPosts = []

    if(filterd.length == 0){
        console.log('Stopped, no new posts')
        posts = []
        prevPosts = []
        stop();
    }

    console.log(filterd.length+' actual length')

    for(let i = 0; i < filterd.length; i++){
        if(playing){
            debugCounter++
            await readIt(filterd[i].comment, filterd[i].author, filterd[i].commentLink)
        }else{ 
            prevPosts = posts
            posts = []
            return ;}
    }
    if(playing){
        debugCounter = 0
        bufferNumber = bufferNumber + 5;
        prevPosts = posts;
        posts = []
        play();
    }
}

async function readIt(phrase, author, commentLink){
    
    msg.onend = function () { console.log("on end!"); }
    msg.onerror = function () { console.log("on error!"); }
    msg.onpause = function () { console.log("on pause"); }
    msg.onresume = function () { console.log("on resume"); }
    msg.onstart = function () { console.log(debugCounter+' of '+bufferNumber); }
    msg.voice = voices[voiceNum];
    console.log(phrase)
    msg.text = phrase;
    window.speechSynthesis.cancel();
    setTimeout(()=>{window.speechSynthesis.speak(msg)},1250)
    if(operatingSystem === 'Windows'){
        clearInterval(hackResume);
        hackResume = setInterval(function () {
        if (!window.speechSynthesis.speaking){
            clearInterval(hackResume);
        }else{
            console.log('resumed')
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
        }
    }, 14000);
    }
    return new Promise(resolve => {
        document.getElementById('authorBox').innerHTML = ''
        document.getElementById('commentBox').innerHTML = '';
        document.getElementById('commentBox').innerHTML = phrase;
        document.getElementById('authorBox').innerHTML = author;
        document.getElementById("linkToComment").innerHTML = '  - Link to comment';
        document.getElementById("linkToComment").setAttribute("href",commentLink);
        

        msg.onend = resolve;
    })

}


function stop (){
    debugCounter = 0
    bufferNumber = 5
    playing = false
    window.speechSynthesis.resume()
    window.speechSynthesis.cancel()
    stopButton.classList.add('d-none')
    playButton.classList.remove('d-none')
    skipButton.classList.add('d-none')
    placeholder.classList.add('d-none')
    prevPosts = posts
    posts = []
}

function selectChange(){
    var sel = document.getElementById('voiceSelect');
    console.log( sel.selectedIndex );
    voiceNum = sel.selectedIndex
}
function changeVolume(){
    let vol = document.getElementById('volume')
    volume = vol.value
    msg.volume = volume
}
function changeSpeed(){
    let spd = document.getElementById('speed')
    speed = spd.value
    msg.rate = speed
}
function changePitch(){
    let ptch = document.getElementById('pitch')
    pitch = ptch.value
    msg.pitch = pitch
}
function skip (){
    window.speechSynthesis.cancel();
}




if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

function populateVoiceList() {
    function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
    selectElement.remove(i);
        }
    }
    removeOptions(document.getElementById('voiceSelect'));
    if(typeof speechSynthesis === 'undefined') {
        return;
    }
    var sel = document.getElementById('voiceSelect');
    console.log(sel.value)
    voices = speechSynthesis.getVoices();

    for(var i = 0; i < voices.length; i++) {
        var option = document.createElement('option');
        option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
        
    option.setAttribute('data-lang', voices[i].lang);
    option.setAttribute('data-name', voices[i].name);
    document.getElementById("voiceSelect").appendChild(option);
    
    }
}

window.addEventListener('load', function () {
    function getOs () {
        var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

        if (macosPlatforms.indexOf(platform) !== -1) {
            os = 'Mac OS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
            os = 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
            os = 'Windows';
        } else if (/Android/.test(userAgent)) {
            os = 'Android';
        } else if (!os && /Linux/.test(platform)) {
            os = 'Linux';
        }

    operatingSystem = os;
    }
    populateVoiceList();
    getOs();

    if(operatingSystem == 'Android'){
        let select = document.getElementById('voiceSelect')
        select.classList.add('d-none') 
        document.getElementById('androidHelp').classList.remove('d-none')       
    }
    if(operatingSystem === 'Mac OS' || operatingSystem === 'iOS'){
        document.getElementById('skipButton').remove();
    }
})

window.speechSynthesis.onvoiceschanged = () => {populateVoiceList()}


const ctx = new AudioContext();
let originalSource;
let originalSourcePlaying = false;
let newSource;
let newSourcePlaying = false;
let subDivision = 1;
let bpm = 110;
let samplesPerMeasure = Math.floor(44100 * 60 / bpm) * 4;
let length;
let chunks = [];
let playing = [];
let taps = [];
let selectedChunkFn = straightChunks;


function setOriginalSource(buffer) {
    ctx.decodeAudioData(buffer)
        .then(decodedData => {
            originalSource = ctx.createBufferSource();
            originalSource.buffer = decodedData;
            console.log('Original source decoded');
        });
}

function resetBuffers(currentSource) {
    const buffer = currentSource.buffer;
    originalSource = ctx.createBufferSource();
    originalSource.buffer = buffer;
    originalSource.connect(ctx.destination);
}

function scramble(chunkFn, sortFn) {
    createAudioChunks(chunkFn)
    const scrambledChunks = chunks.sort(sortFn || randomSort);
    const scrambledBuffer = ctx.createBuffer(2, length, ctx.sampleRate);
    const frameSize = parseInt(samplesPerMeasure / subDivision);

    for (let channel = 0; channel < scrambledBuffer.numberOfChannels; channel++) {
        const nowBuffering = scrambledBuffer.getChannelData(channel);
        for (let i = 0; i < scrambledChunks.length; i++) {
            for (let j = 0; j < scrambledChunks[i][channel].length; j++) {
                nowBuffering[j + (i * frameSize)] = scrambledChunks[i][channel][j];
            }
        }
    }
    newSource = ctx.createBufferSource();
    newSource.buffer = scrambledBuffer
    newSource.connect(ctx.destination);
    console.log('scramble complete');
}

function createAudioChunks(chunkFn) {
    chunks = [];
    const ch0 = originalSource.buffer.getChannelData(0);
    const ch1 = originalSource.buffer.getChannelData(1);
    chunkFn ? chunkFn(ch0, ch1) : straightChunks(ch0, ch1);
}

function straightChunks(ch0, ch1) {
    length = originalSource.buffer.length;
    const frameSize = parseInt(samplesPerMeasure / subDivision); 

    for (let i = 0; i < length; i += frameSize) {
        let frame;
        const numRemainingSamps = length - i; 
        if (numRemainingSamps < frameSize) {
            frame = numRemainingSamps
        } else {
            frame = frameSize;
        }
        
        chunks.push([
            ch0.slice(i, i + frame),
            ch1.slice(i, i + frame)
        ]); 
    }  
}

function reverseChunks(ch0, ch1) {
    length = originalSource.buffer.length;
    const frameSize = parseInt(samplesPerMeasure / subDivision); 

    for (let i = 0; i < length; i += frameSize) {
        let frame;
        const numRemainingSamps = length - i; 
        if (numRemainingSamps < frameSize) {
            frame = numRemainingSamps
        } else {
            frame = frameSize;
        }
        
        chunks.push([
            ch0.slice(i, i + frame).reverse(),
            ch1.slice(i, i + frame).reverse()
        ]); 
    }  
}

function stereoDecoupledChunks(ch0, ch1) {
    length = originalSource.buffer.length;
    const frameSize = parseInt(samplesPerMeasure / subDivision); 
    const channel0 = [];
    const channel1 = [];

    for (let i = 0; i < length; i += frameSize) {
        let frame;
        const numRemainingSamps = length - i; 
        if (numRemainingSamps < frameSize) {
            frame = numRemainingSamps
        } else {
            frame = frameSize;
        }
        
        channel0.push(ch0.slice(i, i + frame)),
        channel1.push(ch1.slice(i, i + frame))
    }

    const ch0Sorted = channel0.sort(randomSort);
    const ch1Sorted = channel1.sort(randomSort);

    for (let i = 0; i < ch0Sorted.length; i++) {
        chunks.push([
            ch0Sorted[i],
            ch1Sorted[i]
        ]);
    }
}

function chaos(ch0, ch1) {
    length = originalSource.buffer.length;
    
    const channel0 = [];
    const channel1 = [];
    let frameSize = Math.floor((Math.random() * ((samplesPerMeasure * 4) - samplesPerMeasure/64)) + samplesPerMeasure/64);

    for (let i = 0; i < length; i += frameSize) {
        frameSize = Math.floor((Math.random() * ((samplesPerMeasure * 4) - samplesPerMeasure/64)) + samplesPerMeasure/64);
        let frame;
        const numRemainingSamps = length - i; 
        if (numRemainingSamps < frameSize) {
            frame = numRemainingSamps
        } else {
            frame = frameSize;
        }
        
        channel0.push(ch0.slice(i, i + frame)),
        channel1.push(ch1.slice(i, i + frame))
    }

    const ch0Sorted = channel0.sort(randomSort);
    const ch1Sorted = channel1.sort(randomSort);

    for (let i = 0; i < ch0Sorted.length; i++) {
        chunks.push([
            Math.random() > 0.5 ? ch0Sorted[i] : ch0Sorted[i].reverse(),
            Math.random() > 0.5 ? ch1Sorted[i] : ch1Sorted[i].reverse()
        ]);
    }
}

function randomSort(a, b) {
    return 0.5 - Math.random();
}

function setTapTempo(tap) {
    if (taps.length === 4) {
        taps.shift();
    }
    
    taps.push(new Date().getTime());
    
    if (taps.length === 1) return;

    const diffs = [];
    let total = 0;
    for (let i = 0; i < taps.length; i++) {
        if (i > 0) {
            diffs.push(taps[i] - taps[i - 1]);
            total += (taps[i] - taps[i - 1]);
        }
    } 

    newBpm = Math.floor(60000 / (total/diffs.length));

    setBpm(newBpm);
}

function getSubdivision(value) {
    console.log(value);
    const division = {};
    let subVal;
    let subLabel;

    switch(value) {
        case '1':
            subLabel = '1/1';
            subVal = 1;
            break;
        case '2':
            subLabel = '1/2';
            subVal =  2;
            break;
        case '3':
            subLabel = '1/4';
            subVal = 4;
            break;
        case '4':
            subLabel = '1/8';
            subVal = 8;
            break;
        case '5':
            subLabel = '1/16';
            subVal = 16;
            break;
        case '6':
            subLabel = '1/32';
            subVal = 32;
            break;
        case '7':
            subLabel = '1/64';
            subVal = 64;
            break;
    }

    return Object.assign(division, {
        subLabel, 
        subVal
    });

}


function setBpm(val) {
    bpm = val;
    document.getElementById('bpm').value = bpm;
}

function stopAll() {
    playing.forEach((source) => {
        source.stop();
    });

    playing = [];
}

(function setEventHandlers() {
    document.getElementById('file-input').addEventListener('change', function(){
        handleFile(this.files[0]);
    });
    
    const subValue = document.getElementById('subValue');
    document.getElementById('sub').addEventListener('input', function() {
        let sub = getSubdivision(this.value);
        console.log(sub.subLabel, sub.subVal);
        subValue.innerHTML = sub.subLabel;
        subDivision = sub.subVal;
    });
    
    document.getElementById('scramble').addEventListener('click', () => {
        if (originalSource) {
            stopAll();
            scramble(selectedChunkFn);
        }  
    });
    
    document.getElementById('bpm').addEventListener('change', function() {
        bpm = this.value;
    });

    document.getElementById('playOriginal').addEventListener('click', () => {
        if (originalSource) {
            stopAll();
            resetBuffers(originalSource);
            playing.push(originalSource);
            originalSource.start()
        }
    });

    document.getElementById('playNew').addEventListener('click', () => {
        if (newSource) {
            stopAll();
            resetBuffers(newSource);
            playing.push(newSource);
            newSource.start()
        }
    });

    document.getElementById('stop').addEventListener('click', () => {
        stopAll();
    });

    document.getElementById('chunkFunc').addEventListener('change', function() {
        switch(this.value) {
            case 'random':
                selectedChunkFn = straightChunks;
            break;
            case 'randomReverse':
                selectedChunkFn = reverseChunks;
            break;
            case 'randomStereoUnlinked':
                selectedChunkFn = stereoDecoupledChunks;
            break;
            case 'chaos': 
                selectedChunkFn = chaos;
            break;
        }
    });

    document.getElementById('tap').addEventListener('click', () => {
        setTapTempo();
    })
    
})();

function handleFile (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        setOriginalSource(event.target.result);  
    }
    reader.readAsArrayBuffer(file);    
}

  

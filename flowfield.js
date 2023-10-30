let dancingWords = [];
let words = [];
let currentWordIndex = 0; 
const noiseScale = 1000;
let isInverted = false;  // false means the background is white, text is black

const textSentence = 'I like to think of a cybernetic meadow where mammals and computers live together in mutually programming harmony like pure water touching clear sky. I like to think of a cybernetic forest filled with pines and electronics where deer stroll peacefully past computers as if they were flowers with spinning blossoms. I like to think of a cybernetic ecology where we are free of our labors and joined back to nature, returned to our mammal brothers and sisters, and all watched over by machines of loving grace.';

const textSentenceArray = textSentence.split(' ');


const volume = new Tone.Volume(-30);  // initial volume in decibels
const reverb = new Tone.Reverb({
  decay: 10,
  wet: .7
}).connect(volume).toDestination();

const synth = new Tone.Synth({
    oscillator: {
        type: 'sine'
    },
    envelope: {
      attack: 10,
      decay: 1,
      sustain: 1,
      release: 10
    }
}).connect(reverb);

let lastNoteTime = 0;
const noteCooldown = .01;
const APentatonicMinor = ["A", "C", "D", "E", "G"];
const maxNotesForVolumeAdjustment = 5; // adjust this as needed
let noteCountsInLastSecond = []; 

document.getElementById("beginScreen").addEventListener("click", function() {
  this.style.display = "none";
  document.getElementById('home-icon').style.filter = "none"; // Set filter to none to revert the inversion
  Tone.start();
});

let body = document.querySelector('body');
body.addEventListener('click', () => { Tone.start() });


function findEndOfSentence(startIndex) {
  for (let i = startIndex; i < textSentenceArray.length; i++) {
      if (textSentenceArray[i].endsWith('.') || textSentenceArray[i].endsWith('!') || textSentenceArray[i].endsWith('?')) {
          return i;
      }
  }
  return textSentenceArray.length - 1;  // if no sentence delimiter is found, return the last word
}

class DanceSpan {
  constructor(element, x, y) {
      this.loc = createVector(x, y);
      this.dir = createVector(0, 0);
      this.speed = random(0.5, 2);
      element.position(x, y);
      this.element = element;
      this.playNote();
  }

  playNote() {
    if (Tone.now() - lastNoteTime > noteCooldown) {
      let scaleIndex = Math.floor(map(this.loc.x, 0, windowWidth, 0, APentatonicMinor.length * 4));

      let note = APentatonicMinor[scaleIndex % APentatonicMinor.length];
      let octaveOffset = Math.floor(scaleIndex / APentatonicMinor.length);
      let midiNoteString = note + (3 + octaveOffset);
      let octave = 3 + octaveOffset; // Store the current octave

      let frequency = Tone.Midi(midiNoteString).toFrequency();
      volume.volume.value = -20;  // Set a test volume value.
      
      let noteDuration;
      const numWords = words.length;

      // Determine the note duration based on the number of words
      if (numWords <= 100) {
        noteDuration = '8n';
      } else if (numWords <= 200) {
        noteDuration = '16n';
      } else if (numWords <= 300) {
        noteDuration = '32n';
      } else {
        noteDuration = '64n';
      }

      synth.triggerAttackRelease(frequency, noteDuration, Tone.now());
      lastNoteTime = Tone.now();

      this.adjustVolumeBasedOnNoteDensity();

      if (octave >= 5) {
        invertColors();
      }
    }
  }

  adjustVolumeBasedOnNoteDensity() {
      const currentTime = Tone.now();

      noteCountsInLastSecond.push(currentTime);

      // filter out notes that were played more than 1 second ago
      noteCountsInLastSecond = noteCountsInLastSecond.filter(time => currentTime - time <= 1);

      let noteDensity = noteCountsInLastSecond.length / maxNotesForVolumeAdjustment;

      if (noteDensity > 1) noteDensity = 1; 

      const volumeReduction = map(noteDensity, 0, 1, -12, -300);
      volume.volume.value = volumeReduction;

     volume.volume.rampTo(volumeReduction, 0.1); // this smoothly transitions the volume change over 0.1 seconds
    }

  flowField() {
      let angle = noise(this.loc.x / noiseScale, this.loc.y / noiseScale) * TWO_PI;
      this.dir.x = cos(angle);
      this.dir.y = sin(angle);

      let vel = this.dir.copy();
      vel.mult(this.speed);
      this.loc.add(vel);
      this.element.position(this.loc.x, this.loc.y);
  }

  isOffScreen() {
      return this.loc.x > windowWidth || this.loc.x < 0 || this.loc.y > windowHeight || this.loc.y < 0;
  }
}

function toggleInversion() {
  if (isInverted) {
      body.style.backgroundColor = "white";
      body.style.color = "black";
  } else {
      body.style.backgroundColor = "black";
      body.style.color = "white";
  }
  isInverted = !isInverted;
}


function adjustVolumeBasedOnNoteDensity() {
  const currentTime = Tone.now();

  noteCountsInLastSecond.push(currentTime);

  // filter out notes that were played more than 1 second ago
  noteCountsInLastSecond = noteCountsInLastSecond.filter(time => currentTime - time <= 1);

  let noteDensity = noteCountsInLastSecond.length / maxNotesForVolumeAdjustment;

  if (noteDensity > 1) noteDensity = 1; 

  const volumeReduction = map(noteDensity, 0, 1, 0, -42); // reduce volume up to -12 dB at max density
  volume.volume.rampTo(volumeReduction, 0.1); // this smoothly transitions the volume change over 0.1 seconds
}

function updateTextDisplay() {
    dancingWords.forEach(dw => dw.element.remove());
    dancingWords = [];

    for (let i = 0; i < words.length; i++) {
        const spannedWord = createSpan(words[i]);
        const dw = new DanceSpan(spannedWord, random(windowWidth), random(windowHeight));
        dancingWords.push(dw);
    }
    console.log('Current number of words:', words.length);

}
let invertEnabled = true; // This flag is now global and can be accessed by invertColors

function resetStyles() {
  document.body.style.backgroundColor = "white";
  document.body.style.color = "black";
  const homeIcon = document.getElementById('home-icon');
  const infoIcon = document.getElementById('info-icon');
  homeIcon.style.filter = "none";
  infoIcon.style.filter = "none";
}


function keyPressed() {
    if (key === 'i' || key === 'I') {
        invertEnabled = !invertEnabled; // Toggle the invertEnabled flag
        if (!invertEnabled) {
          // If we're disabling the invert, reset styles to default
          resetStyles();
        }
        return false;
      }
  
    // Actions for arrow keys
    if (keyCode === UP_ARROW) {
      words.push(textSentenceArray[currentWordIndex]);
      currentWordIndex++;
      if (currentWordIndex >= textSentenceArray.length) {
        currentWordIndex = 0;
      }
      updateTextDisplay();
      return false; // Prevents any other key interactions when UP_ARROW is pressed
    } else if (keyCode === DOWN_ARROW && words.length > 0) {
      words.pop();
      currentWordIndex--;
      if (currentWordIndex < 0) {
        currentWordIndex = textSentenceArray.length - 1;
      }
      updateTextDisplay();
      return false; // Prevents any other key interactions when DOWN_ARROW is pressed
    } else if (keyCode === RIGHT_ARROW) {
      const endIndex = findEndOfSentence(currentWordIndex);
      while (currentWordIndex <= endIndex) {
        words.push(textSentenceArray[currentWordIndex]);
        currentWordIndex++;
      }
      if (currentWordIndex >= textSentenceArray.length) {
        currentWordIndex = 0;
      }
      updateTextDisplay();
      return false; // Prevents any other key interactions when RIGHT_ARROW is pressed
    } else if (keyCode === LEFT_ARROW && words.length > 0) {
      words = [];
      currentWordIndex = 0;
      updateTextDisplay();
      return false; // Prevents any other key interactions when LEFT_ARROW is pressed
    }
    
    // Prevents any default behavior and stop propagation for any other keys
    return false;
  }
  


function setup() {
    noCanvas();
    words.push(textSentenceArray[currentWordIndex]);
    currentWordIndex++;

    updateTextDisplay();
}

function averageLocation() {
    let totalX = 0;
    let totalY = 0;
    for (let dw of dancingWords) {
        totalX += dw.loc.x;
        totalY += dw.loc.y;
    }
    return createVector(totalX / dancingWords.length, totalY / dancingWords.length);
}



function invertColors() {
    if (!invertEnabled) {
        return; // Exit the function if invertEnabled is false
      }
    const homeIcon = document.getElementById('home-icon');
    const infoIcon = document.getElementById('info-icon');
  
    isInverted = !isInverted;
    if (isInverted) {
      document.body.style.backgroundColor = "black";
      document.body.style.color = "white";
      homeIcon.style.filter = "invert(100%)";
      infoIcon.style.filter = "invert(100%)";
    } else {
      document.body.style.backgroundColor = "white";
      document.body.style.color = "black";
      homeIcon.style.filter = "none";
      infoIcon.style.filter = "none";
    }
  }
  

function draw() {
    for (let i = 0; i < dancingWords.length; i++) {
        dancingWords[i].flowField();

        if (dancingWords[i].isOffScreen()) {
            const spannedWord = createSpan(random(words));
            const dw = new DanceSpan(spannedWord, random(windowWidth), random(windowHeight));
            dancingWords.push(dw);
            dancingWords[i].element.remove();
            dancingWords.splice(i, 1);
        }
    }
    
    let avgPos = averageLocation();
    fill(255, 0, 0);
    ellipse(avgPos.x, avgPos.y, 20, 20);
}



document.addEventListener('DOMContentLoaded', (event) => {
  document.getElementById('info-icon-wrapper').addEventListener('click', function() {
      var infoOverlay = document.getElementById('info-overlay');
      if (infoOverlay.style.display === 'none' || infoOverlay.style.display === '') {
          infoOverlay.style.display = 'block';
      } else {
          infoOverlay.style.display = 'none';
      }
  });
  document.getElementById('close-icon').addEventListener('click', function() {
      document.getElementById('info-overlay').style.display = 'none';
  });
});





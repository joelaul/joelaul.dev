// IMPORT

// import { typewriter } from './typewriter';

// DOM

const body = document.querySelector('body');
const me = document.querySelector('.me');
const h1 = document.querySelector('.h1');
const socialEls = document.querySelectorAll('.user-social > a');
const socialRow = document.querySelector('.row.social');
const desc = document.querySelector('.user-description');

// STATE

const state = {
    descText: `🎸👨‍💻 I'm a guitarist and recording artist turned fullstack developer. I like building things that awaken people's curiosity.`
}

// FUNCTIONS

const typewriter = (element, text, ms) => {
    // if (!localStorage['typewriterDone']) {
        desc.textContent = '';
        let index = 0;

        let interval = setInterval(() => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(interval);
            }
        }, ms)
        // localStorage.setItem('typewriterDone', 'true');
   /*  } else {
        desc.textContent = state.descText;
    } */
}

// HANDLERS

// INIT

const init = () => {
    window.addEventListener('load', () => {
        typewriter(desc, state.descText, 30)
    });
    for (let el of socialEls) {
        el.firstChild.addEventListener('mouseover', () => {
            h1.textContent = el.title;
            let audio = new Audio(`audio/${el.title.toLowerCase()}.wav`);
            audio.play();
            el.firstChild.style.color = el.classList[2];
            h1.style.color = el.classList[2];
            if (el.classList[1] == 'resume') {
                el.firstChild.src = "resume-hover.png"
            }
        });
    };
    socialRow.addEventListener('mouseout', () => {
        h1.textContent = 'Joe Lauletta';
        h1.style.color = 'black';
    });
    me.addEventListener('click', () => {
        me.classList.toggle('spin');
        for (let el of socialEls) {
            el.firstChild.style.color = '#333333';
            if (el.classList[1] == 'resume') {
                el.firstChild.src = "resume.png"
            }
            el.classList.toggle('spin');
        }
    });
}

init();

// TODO(joe): when all socialEls are colored, animate sequential bounce + arpeggio
// TODO(joe): on load, slide in components from opposite sides
// TODO(joe): profile rolling animation?
// TODO(joe): dsp w/ webaudioapi?
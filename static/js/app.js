// DOM

const body = document.querySelector('body');
const me = document.querySelector('.me');
const h1 = document.querySelector('.h1');
const socialEls = document.querySelectorAll('.user-social > a');
const socialRow = document.querySelector('.row.social');
const desc = document.querySelector('.user-description');

// STATE

const state = {
    descText: `🎸👨‍💻 I'm a guitarist and recording artist turned fullstack developer. I like building things that awaken people's curiosity.`,
    ctaText: `
        <div>
            <a class="cta" href="/portfolio" target="_blank">
                Check out some of my work!
            </a>
        </div>
        `,
    hoveredSocialEls: [],
    typewriterInterval: null,
    typewriterDone: false
}

// HELPERS

const isUniqueSocialEl = (el) => {
    return state.hoveredSocialEls.indexOf(el) == -1;
}

const typewriter = (element, text, ms) => {
        desc.textContent = '';
        let index = 0;

        state.typewriterInterval = setInterval(() => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(state.typewriterInterval);
                state.typewriterDone = true;
            }
        }, ms)

}

const renderCallToAction = () => {
    if (state.typewriterDone) {
        desc.innerHTML += state.ctaText;
    } else {
        clearInterval(state.typewriterInterval);
        desc.innerHTML = state.descText + state.ctaText;
        state.typewriterDone = true;
    }
}

// HANDLERS

const handleSocialElMouseover = (el) => {
    let audio = new Audio(`audio/${el.title.toLowerCase()}.wav`);
    audio.setAttribute('aria-muted', 'false');
    audio.play();

    h1.textContent = el.title;
    el.firstChild.style.color = el.classList[2];
    h1.style.color = el.classList[2];

    if (el.classList[1] == 'resume') {
        el.firstChild.src = "../img/resume-hover.png"
    }

    if (state.hoveredSocialEls.length < 5 && isUniqueSocialEl(el)) {
        state.hoveredSocialEls.push(el);
        if (state.hoveredSocialEls.length == 5) {
            renderCallToAction();
        }
    } else {}
}

const handleMeClick = () => {
    me.classList.toggle('spin');
    for (let el of socialEls) {
        el.firstChild.style.color = '#333333';
        if (el.classList[1] == 'resume') {
            el.firstChild.src = "../img/resume.png"
        }
        el.classList.toggle('spin');
    }
}

// INIT

const init = () => {
    window.addEventListener('load', () => {
        typewriter(desc, state.descText, 25)
    });

    for (let el of socialEls) {
        el.firstChild.addEventListener('mouseover', () => {
            handleSocialElMouseover(el);
        });
    };

    socialRow.addEventListener('mouseout', () => {
        h1.textContent = 'Joe Lauletta';
        h1.style.color = 'black';
    });

    me.addEventListener('click', handleMeClick);
}


init();

// TODO(joe): when all socialEls are colored, animate sequential bounce + arpeggio
// TODO(joe): on load, require click (start) + slide in components from opposite sides
// TODO(joe): profile rolling animation
// TODO(joe): dsp w/ webaudioapi
// TODO(joe): fix css responsive
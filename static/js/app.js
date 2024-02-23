// DOM

const body = document.querySelector('body');
const me = document.querySelector('.me');
const h1 = document.querySelector('.h1');
const socialEls = document.querySelectorAll('.social > a');
const socialContainer = document.querySelector('.social-container');
const desc = document.querySelector('.description');
const brand = document.querySelector('.navbar-brand');

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

    // desc.classList.add('cta-border');
}

// HANDLERS

const handleSocialElMouseover = (el) => {
    let audio = new Audio(`audio/${el.title.toLowerCase()}.wav`);
    audio.setAttribute('aria-muted', 'false');
    audio.play();

    let link = el.classList[1];
    let color = el.classList[2];

    h1.textContent = el.title;
    el.firstChild.style.color = color;
    h1.style.color = color;
    brand.style.color = color;
    
    body.style.background = `linear-gradient(-45deg, ${color}40, white)`;


    if (link == 'resume') {
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
    h1.style.color = 'black';
    body.style.background = 'white';
    brand.style.color = 'white';
    for (let el of socialEls) {
        let link = el.classList[1];
        el.firstChild.style.color = '#333333';
        if (link == 'resume') {
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
        el.firstChild.addEventListener('touchmove', () => {
            handleSocialElMouseover(el);
        });
    };

    socialContainer.addEventListener('mouseout', () => {
        h1.textContent = 'Joe Lauletta';
    });

    socialContainer.addEventListener('touchend', () => {
        h1.textContent = 'Joe Lauletta';
        socialContainer.removeEventListener('touchmove', () => {
            handleSocialElMouseover(el);
        });
    });

    me.addEventListener('click', handleMeClick);
}


init();


// TODO(joe)

// fix      - mob css / touch, talk-anim, bg-anim (ring pulse?), cache audio
// onload   - solo-face / click -> slide in components
// extras   - social hop sequence / slidebar, webaudio-dsp
// !        - migrate from hugo / bootstrap, integrate pedalboard
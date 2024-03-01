// dom

const body = document.querySelector('body');
const me = document.querySelector('.me');
const h1 = document.querySelector('.h1');
const socialEls = document.querySelectorAll('.social > a');
const socialContainer = document.querySelector('.social-container');
const desc = document.querySelector('.description');
const brand = document.querySelector('.navbar-brand');

// state

const state = {
    descText: `🎸👨‍💻 I'm a guitarist and recording artist turned fullstack developer. I like building things that awaken people's curiosity.`,
    ctaText: `
        <div>
            <a class="cta" style="padding-right: 10px" href="/portfolio" target="_blank">
                Check out some of my work!
            </a>
        </div>
        `,
    hoveredSocialEls: [],
    typewriterInterval: null,
    typewriterDone: false
}

// helpers

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

// handlers

const handleSocialElMouseover = (el) => {
    let audio = new Audio(`audio/${el.title.toLowerCase()}.wav`);
    audio.setAttribute('aria-muted', 'false');
    audio.play();

    let link = el.classList[1];
    let theme = el.classList[2];

    h1.textContent = el.title;
    el.firstChild.style.color = theme;
    h1.style.color = theme;
    brand.style.color = theme;
    
    body.style.background = `linear-gradient(-45deg, ${theme}40, white)`;

    if (link == 'resume') {
        el.firstChild.src = "../img/resume-hover.png"
    }

    if (state.hoveredSocialEls.length < 5 && isUniqueSocialEl(el)) {
        state.hoveredSocialEls.push(el);
        if (state.hoveredSocialEls.length == 5) {
            renderCallToAction();
        }
    } else {}

    localStorage.setItem('theme', theme)
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

    localStorage.clear();
}

// init

const init = () => {
    window.addEventListener('load', () => {
        typewriter(desc, state.descText, 25);
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

// fix      - mob-touch-pfp, social-slidebar, anim-talk, audio-cache
// onload   - solo-face,  click -> container-slidein
// extras   - social-hop, add-pedalboard, migrate
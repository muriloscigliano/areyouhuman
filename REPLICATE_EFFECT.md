# Sticky Cards Effect - Complete Implementation Guide

## 1. Dependencies (package.json)

```json
{
  "dependencies": {
    "gsap": "^3.13.0",
    "lenis": "^1.3.8",
    "vite": "^7.1.2"
  }
}
```

Install with: `npm install`

---

## 2. HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sticky Cards</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <section class="hero">
      <h1>Your Hero Title</h1>
    </section>

    <section class="sticky-cards">
      <div class="card" id="card-1">
        <div class="card-inner">
          <div class="card-info">
            <p>Card 1 description</p>
          </div>
          <div class="card-title">
            <h1>Title 1</h1>
          </div>
          <div class="card-description">
            <p>Detailed description for card 1</p>
          </div>
          <div class="card-img">
            <img src="/your-image-1.jpg" alt="" />
          </div>
        </div>
      </div>
      
      <div class="card" id="card-2">
        <div class="card-inner">
          <div class="card-info">
            <p>Card 2 description</p>
          </div>
          <div class="card-title">
            <h1>Title 2</h1>
          </div>
          <div class="card-description">
            <p>Detailed description for card 2</p>
          </div>
          <div class="card-img">
            <img src="/your-image-2.jpg" alt="" />
          </div>
        </div>
      </div>
      
      <!-- Add more cards as needed -->
    </section>

    <section class="outro">
      <h1>Your Outro Title</h1>
    </section>
    
    <script type="module" src="/script.js"></script>
  </body>
</html>
```

---

## 3. CSS Styles (styles.css)

```css
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap");

:root {
  --accent-1: #b1c0ef;
  --accent-2: #f2acac;
  --accent-3: #fedd93;
  --accent-4: #81b7bf;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Host Grotesk", sans-serif;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h1 {
  text-transform: uppercase;
  font-family: "Barlow Condensed";
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
}

p {
  text-transform: uppercase;
  font-weight: 500;
}

.hero,
.outro {
  position: relative;
  width: 100vw;
  height: 100svh;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: #f9f4eb;
  color: #141414;
}

.sticky-cards {
  position: relative;
  width: 100vw;
  background-color: #0f0f0f;
}

.card {
  position: sticky;
  width: 100%;
  height: 125svh;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform-origin: 50% 100%;
  will-change: transform;
  text-align: center;
}

#card-1 .card-inner {
  background-color: var(--accent-1);
}

#card-2 .card-inner {
  background-color: var(--accent-2);
}

#card-3 .card-inner {
  background-color: var(--accent-3);
}

#card-4 .card-inner {
  background-color: var(--accent-4);
}

.card-info {
  width: 25%;
  padding: 4em;
  text-align: left;
}

.card-info p {
  font-size: 0.9rem;
}

.card-title h1 {
  font-size: 10rem;
  padding: 2rem 0;
}

.card-description {
  width: 60%;
  margin: 0 auto 2em auto;
}

.card-description p {
  font-size: 1.5rem;
}

.card-img {
  width: 100%;
  height: 100%;
  margin-top: 4em;
  overflow: hidden;
}

.card-inner::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  opacity: var(--after-opacity, 0);
  will-change: opacity;
  pointer-events: none;
  z-index: 2;
}

@media (max-width: 1000px) {
  h1,
  .card-description {
    width: calc(100% - 4rem);
    font-size: 3rem;
    margin: 0 auto;
  }

  .card-info {
    width: 75%;
    margin: 0 auto;
    padding: 4em 2em;
    text-align: center;
  }

  .card-title h1 {
    font-size: 3rem;
  }

  .card-description p {
    font-size: 1.25rem;
  }
}
```

---

## 4. JavaScript (script.js)

```javascript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const cards = gsap.utils.toArray(".card");

  cards.forEach((card, index) => {
    if (index < cards.length - 1) {
      const cardInner = card.querySelector(".card-inner");

      gsap.fromTo(
        cardInner,
        {
          y: "0%",
          z: 0,
          rotationX: 0,
        },
        {
          y: "-50%",
          z: -250,
          rotationX: 45,
          scrollTrigger: {
            trigger: cards[index + 1],
            start: "top 85%",
            end: "top -75%",
            scrub: true,
            pin: card,
            pinSpacing: false,
          },
        }
      );

      gsap.to(cardInner, {
        "--after-opacity": 1,
        scrollTrigger: {
          trigger: cards[index + 1],
          start: "top 75%",
          end: "top -25%",
          scrub: true,
        },
      });
    }
  });
});
```

---

## 5. Quick Setup Steps

1. **Install dependencies:**
   ```bash
   npm install gsap lenis vite
   ```

2. **Create the files:**
   - `index.html` (use HTML structure above)
   - `styles.css` (use CSS above)
   - `script.js` (use JavaScript above)

3. **Add images:**
   - Place your images in the `public/` folder
   - Update image paths in HTML

4. **Run the project:**
   ```bash
   npm run dev
   ```

---

## Key Features

- **Smooth scrolling** with Lenis
- **3D card rotation** effect on scroll
- **Sticky pinning** of cards during scroll
- **Fade overlay** effect as cards transition
- **Responsive design** for mobile devices

## Customization Tips

- Change colors in `:root` CSS variables
- Adjust card heights by modifying `.card { height: 125svh; }`
- Modify animation values in `script.js` (y, z, rotationX)
- Adjust scroll trigger points (`start`, `end` values)
- Add more cards by duplicating the card HTML structure


// --- Particle Effect Script ---
// Ensure this code is placed in js/particle-effect.js and linked from index.html

// Wait for the DOM to be fully loaded before running the script
// This ensures the canvas element is available.
document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('particle-canvas');
    // Ensure canvas element exists before trying to get context
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray;

        // Get mouse position
        const mouse = {
            x: null,
            y: null,
            radius: 50 // Initial radius, will be updated on resize
        };

        // Function to update mouse radius based on canvas size
        function updateMouseRadius() {
            if (canvas.width && canvas.height) {
                let smallerDimension = Math.min(canvas.width, canvas.height);
                mouse.radius = smallerDimension / 15;
                if (mouse.radius < 50) mouse.radius = 50;
                if (mouse.radius > 150) mouse.radius = 150;
            } else {
                mouse.radius = 100; // Fallback
            }
        }

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        });
        window.addEventListener('mouseout', () => {
             mouse.x = null;
             mouse.y = null;
        });
         window.addEventListener('touchstart', (event) => {
            if (event.touches.length > 0) {
                mouse.x = event.touches[0].clientX;
                mouse.y = event.touches[0].clientY;
            }
         }, { passive: true });
         window.addEventListener('touchmove', (event) => {
             if (event.touches.length > 0) {
                 mouse.x = event.touches[0].clientX;
                 mouse.y = event.touches[0].clientY;
             }
         }, { passive: true });
         window.addEventListener('touchend', () => {
             mouse.x = null;
             mouse.y = null;
         });

        // Particle class
        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x;
                this.y = y;
                this.baseX = this.x;
                this.baseY = this.y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
                this.density = (Math.random() * 30) + 1;
            }

            draw() {
                // Check if context exists before drawing
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                // Check if canvas exists before updating
                if (!canvas) return;
                // Bounce off edges
                if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                    this.directionX = -this.directionX;
                    if (this.x + this.size > canvas.width) this.x = canvas.width - this.size;
                    if (this.x - this.size < 0) this.x = this.size;
                }
                if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                    this.directionY = -this.directionY;
                    if (this.y + this.size > canvas.height) this.y = canvas.height - this.size;
                    if (this.y - this.size < 0) this.y = this.size;
                }

                // Mouse interaction - push away
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    // Avoid division by zero if distance is zero
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) distance = 0.1; // Add a small offset if distance is zero

                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let maxDistance = mouse.radius + this.size;
                    let force = (maxDistance - distance) / maxDistance;
                    if (force < 0) force = 0;
                    if (force > 1) force = 1;
                    let directionX = forceDirectionX * force * this.density * 0.4;
                    let directionY = forceDirectionY * force * this.density * 0.4;

                    if (distance < maxDistance) {
                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }

                // Move particle by its own direction
                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        // Create particle array
        function init() {
            // Check if canvas exists before initializing
            if (!canvas) return;
            particlesArray = [];
            // *** MODIFIED: Decreased divisor from 10000 to 8000 to increase particle density ***
            let numberOfParticles = (canvas.width * canvas.height) / 8000;
            if (numberOfParticles < 70) numberOfParticles = 70; // Adjusted min particles
            if (numberOfParticles > 150) numberOfParticles = 150; // Adjusted max particles

            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 1.5) + 1;
                let x = (Math.random() * (canvas.width - size * 2)) + size;
                let y = (Math.random() * (canvas.height - size * 2)) + size;
                let directionX = (Math.random() * 0.6) - 0.3;
                let directionY = (Math.random() * 0.6) - 0.3;
                let r = Math.floor(Math.random() * 50 + 50);
                let g = Math.floor(Math.random() * 100 + 100);
                let b = Math.floor(Math.random() * 100 + 155);
                let alpha = Math.random() * 0.4 + 0.3;
                let color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        // Check if particles are close enough to connect lines
        function connect() {
             // Check if context and particles array exist
            if (!ctx || !particlesArray) return;
            let opacityValue = 1;
            // *** MODIFIED: Decreased divisors from 9 to 8 to increase connection distance ***
            let connectDistance = (canvas.width / 8) * (canvas.height / 8);
            // Adjusted caps for the new distance calculation
            if (connectDistance > 15000) connectDistance = 15000; // Max distance squared (~122px)
            if (connectDistance < 6000) connectDistance = 6000; // Min distance squared (~77px)


            for (let a = 0; a < particlesArray.length; a++) {
                // Connect particles to each other
                for (let b = a + 1; b < particlesArray.length; b++) {
                    let dx = particlesArray[a].x - particlesArray[b].x;
                    let dy = particlesArray[a].y - particlesArray[b].y;
                    let distanceSquared = dx * dx + dy * dy;
                    if (distanceSquared < connectDistance) {
                        opacityValue = 1 - (distanceSquared / connectDistance);
                        ctx.strokeStyle = `rgba(100, 180, 180, ${opacityValue * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
                 // Connect particles to mouse
                 if (mouse.x !== null && mouse.y !== null) {
                     let dxMouse = particlesArray[a].x - mouse.x;
                     let dyMouse = particlesArray[a].y - mouse.y;
                     let mouseDistanceSquared = dxMouse * dxMouse + dyMouse * dyMouse;
                     let mouseConnectRadiusSquared = mouse.radius * mouse.radius;
                     if (mouseDistanceSquared < mouseConnectRadiusSquared) {
                         opacityValue = 1 - (mouseDistanceSquared / mouseConnectRadiusSquared);
                         ctx.strokeStyle = `rgba(150, 220, 220, ${opacityValue * 0.3})`;
                         ctx.lineWidth = 1;
                         ctx.beginPath();
                         ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                         ctx.lineTo(mouse.x, mouse.y);
                         ctx.stroke();
                     }
                 }
            }
        }

        // Animation loop
        function animate() {
            // Check if context exists before animating
            if (ctx) {
                requestAnimationFrame(animate);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (particlesArray) {
                    for (let i = 0; i < particlesArray.length; i++) {
                        particlesArray[i].update();
                    }
                    connect();
                }
            }
        }

        // Resize event - Debounce for performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (canvas) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    updateMouseRadius();
                    init();
                }
            }, 100);
        });

        // Set initial canvas size and start animation
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            updateMouseRadius();
            init();
            animate();
        } else {
            console.error("Could not find canvas element with ID 'particle-canvas'");
        }

    } else {
        console.error("Could not find canvas element with ID 'particle-canvas'");
    }

}); // End of DOMContentLoaded listener


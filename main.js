// Esta función inicializará toda la lógica de la aplicación.
// Recibe la lista de productos específica de la página.
function initializeShop(pageProducts = []) {
    // --- LISTA DE FONDOS DE PANTALLA ---
    const backgroundImages = [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070',
        'https://occ-0-8407-90.1.nflxso.net/dnm/api/v6/Z-WHgqd_TeJxSuha8aZ5WpyLcX8/AAAABXkvV6Z0oypiiKnzyzGYTfQLFu5DvrDCe3iM4cZji4LNkL7_ZWRlf_PAwEGt-5R-nLDP1LKMhLR_HCHviRJjb1pSGJqc6u5wIomS.jpg?r=b60'
    ];

    // --- FUNCIÓN PARA CAMBIAR EL FONDO ---
    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        const randomImageUrl = backgroundImages[randomIndex];
        document.body.style.backgroundImage = `url('${randomImageUrl}')`;
    }

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const productGrid = document.getElementById('product-grid');
    const openCartBtn = document.getElementById('open-cart-btn');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNav = document.getElementById('main-nav');
    const floatingCart = document.getElementById('floating-cart');
    const floatingCartCounter = document.getElementById('floating-cart-counter');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElem = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    let address = '';
    let selectedPaymentMethod = null;

    // --- FUNCIONES DE MANEJO DEL CARRITO ---

    function getCartFromStorage() {
        try {
            const cartData = localStorage.getItem('shoppingCart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (e) {
            console.warn('No se pudo leer el carrito desde localStorage.', e);
            return [];
        }
    }

    let cart = getCartFromStorage();

    function saveCart() {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
        } catch (e) {
            console.warn('No se pudo guardar el carrito en localStorage.', e);
        }
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    }

    function updateCartUI() {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        if (openCartBtn) {
            openCartBtn.textContent = `🛒`;
        }

        if (floatingCart) {
            if (cartCount > 0) {
                floatingCart.classList.add('visible');
                floatingCartCounter.textContent = cartCount;
            } else {
                floatingCart.classList.remove('visible');
                if (cartModal && cartModal.classList.contains('visible')) {
                    toggleCartModal();
                }
            }
        }
    }

    function addToCart(productId, quantity = 1) {
        const productToAdd = pageProducts.find(p => p.id === productId);
        if (!productToAdd) return;
        if (quantity <= 0) return;

        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...productToAdd, quantity: quantity });
        }
        saveCart();
        updateCartUI();
    }

    function removeFromCart(itemIndex) {
        cart.splice(itemIndex, 1);
        saveCart();
        updateCartUI();
        renderCartItems();
    }

    function updateQuantity(itemIndex, change) {
        const item = cart[itemIndex];
        if (!item) return;

        item.quantity += change;

        if (item.quantity <= 0) {
            removeFromCart(itemIndex);
        } else {
            saveCart();
            updateCartUI();
            renderCartItems();
        }
    }

    function clearCart() {
        cart = [];
        saveCart();
        updateCartUI();
        renderCartItems();
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
            cartTotalElem.textContent = 'Total: $0,00';
            return;
        }

        let total = 0;
        cart.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';

            const itemImage = document.createElement('img');
            itemImage.src = item.image;
            itemImage.alt = item.name;

            const itemDetails = document.createElement('div');
            itemDetails.className = 'cart-item-details';
            itemDetails.innerHTML = `
                <p>${item.name} - <strong>$${formatPrice(item.price * item.quantity)}</strong></p>
                <div class="quantity-controls">
                    <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                </div>
            `;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-from-cart-btn';
            removeBtn.textContent = 'Eliminar';
            removeBtn.dataset.index = index;

            itemDiv.appendChild(itemImage);
            itemDiv.appendChild(itemDetails);
            itemDiv.appendChild(removeBtn);
            cartItemsContainer.appendChild(itemDiv);
            total += item.price * item.quantity;
        });

        cartTotalElem.textContent = `Total: $${formatPrice(total)}`;
    }

    function toggleCartModal() {
        if (!cartModal) return;
        if (cartModal.classList.contains('visible')) {
            cartModal.classList.remove('visible');
        } else {
            renderCartItems();
            cartModal.classList.add('visible');
        }
    }

    function handleCheckout() {
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
        if (!selectedPaymentMethod) {
            alert("Por favor, selecciona una forma de pago.");
            return;
        }
        
        const addressInput = cartModal.querySelector('#address-input');
        if (!addressInput.value.trim()) {
            alert("Por favor, ingresa tu dirección de envío.");
            return;
        }

        let message = '¡Hola! Quisiera hacer el siguiente pedido:\n\n';
        let total = 0;
        cart.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - $${formatPrice(item.price * item.quantity)}\n`;
            total += item.price * item.quantity;
        });
        message += `\n*Dirección de envío: ${addressInput.value}*`;
        message += `\n*Forma de pago: ${selectedPaymentMethod}*`;
        message += `\n\n*Total: $${formatPrice(total)}*`;

        const whatsappUrl = `https://wa.me/5493415646850?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    // --- FUNCIONES DE LA PÁGINA ---

    function loadProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        pageProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h4>${product.name}</h4>
                <p class="price">$${formatPrice(product.price)}</p>
                <div class="card-quantity-controls">
                    <button class="quantity-btn" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" class="card-quantity-input" value="1" min="1" step="1" id="quantity-${product.id}">
                    <button class="quantity-btn" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
                <button class="add-to-cart-btn" data-id="${product.id}">Añadir al Carrito</button>
            `;
            productGrid.appendChild(productCard);
        });
    }

    // --- EVENT LISTENERS ---

    if (productGrid) {
        productGrid.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-cart-btn')) {
                const addButton = event.target;
                const productId = parseInt(addButton.dataset.id);
                const quantityInput = document.getElementById(`quantity-${productId}`);
                const quantity = parseInt(quantityInput.value);
                const productCard = addButton.closest('.product-card');
                const productImage = productCard.querySelector('img');

                // --- Inicia la animación ---
                if (productImage) {
                    // 1. Obtener la posición de la imagen del producto y del carrito
                    const productImageRect = productImage.getBoundingClientRect();
                    const floatingCartRect = floatingCart.getBoundingClientRect();

                    // 2. Crear una imagen temporal para la animación
                    const flyingImage = document.createElement('img');
                    flyingImage.src = productImage.src;
                    flyingImage.className = 'fly-to-cart-img';

                    // 3. Posicionar la imagen temporal sobre la imagen original
                    flyingImage.style.left = `${productImageRect.left}px`;
                    flyingImage.style.top = `${productImageRect.top}px`;
                    flyingImage.style.width = `${productImageRect.width}px`;
                    flyingImage.style.height = `${productImageRect.height}px`;

                    document.body.appendChild(flyingImage);

                    // 4. Animar la imagen hacia el carrito
                    requestAnimationFrame(() => {
                        flyingImage.style.left = `${floatingCartRect.left + 15}px`;
                        flyingImage.style.top = `${floatingCartRect.top + 15}px`;
                        flyingImage.style.width = '0px';
                        flyingImage.style.height = '0px';
                        flyingImage.style.opacity = '0';
                    });

                    // 5. Limpiar la imagen del DOM después de la animación
                    setTimeout(() => {
                        flyingImage.remove();
                    }, 1000); // 1000ms = 1s (duración de la transición)
                }

                // --- Lógica existente del carrito ---
                addToCart(productId, quantity);

                addButton.textContent = '¡Añadido!';
                setTimeout(() => {
                    if (quantityInput) quantityInput.value = 1; // Resetea la cantidad a 1
                    addButton.textContent = 'Añadir al Carrito';
                }, 1000);
            }
        });
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            mainNav.classList.toggle('nav-active');
        });
    }

    if (openCartBtn) openCartBtn.addEventListener('click', toggleCartModal);
    if (floatingCart) floatingCart.addEventListener('click', toggleCartModal);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCartModal);
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('remove-from-cart-btn')) {
                const itemIndex = parseInt(target.dataset.index);
                removeFromCart(itemIndex);
            } else if (target.classList.contains('quantity-btn')) {
                const itemIndex = parseInt(target.dataset.index);
                const action = target.dataset.action;
                const change = action === 'increase' ? 1 : -1;
                updateQuantity(itemIndex, change);
            }
        });
    }

    const paymentOptions = document.querySelector('.payment-options');
    if (paymentOptions) {
        paymentOptions.addEventListener('click', (event) => {
            const clickedOption = event.target.closest('.payment-option');
            if (!clickedOption) return;

            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            
            clickedOption.classList.add('selected');
            selectedPaymentMethod = clickedOption.dataset.payment;
        });
    }

    // --- INICIALIZACIÓN ---
    setRandomBackground(); // Establece un fondo aleatorio al cargar la página

    if (pageProducts.length > 0) {
        loadProducts();
    }
    updateCartUI();
}
// ==========================================================================
// DELTASTORE — TIENDA EN LINEA DE REPUESTOS DE MOTOS (TIPO AMAZON)
// Arquitectura Reactiva Zero-Crash, Selector YMM, Toast Engine & Buy Box
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. ESTADO GLOBAL SANITIZADO
    // -------------------------------------------------------------
    let rawCart = [];
    try {
        rawCart = JSON.parse(localStorage.getItem('deltastore_cart') || '[]');
    } catch (e) {
        rawCart = [];
    }

    const sanitizedCart = rawCart.map(it => ({
        id: it.id || it.product_id || Date.now(),
        product_id: it.product_id || it.id,
        name: it.name || it.nombre || 'Repuesto de Moto',
        code: it.code || it.codigo || 'REP-GEN',
        price: Number(it.price ?? it.precio_oferta ?? it.precio ?? 0),
        image: it.image || it.imagen_base64 || '',
        category: it.category || it.categoria_slug || '',
        quantity: Math.max(1, parseInt(it.quantity) || 1)
    }));

    const state = {
        products: [],
        categories: [],
        brands: [],
        motorcycles: [],
        cart: sanitizedCart,
        selectedCategory: '',
        selectedBrand: '',
        selectedMotorcycle: null,
        minPrice: '',
        maxPrice: '',
        offersOnly: false,
        searchQuery: '',
        sortBy: 'featured',
        activeProductModal: null,
        receiptBase64: null
    };

    // -------------------------------------------------------------
    // 2. REFERENCIAS DOM
    // -------------------------------------------------------------
    const productsGrid = document.getElementById('products-grid');
    const resultsCount = document.getElementById('results-count');
    const mainSearchInput = document.getElementById('main-search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const btnMainSearch = document.getElementById('btn-main-search');
    const searchCatDropdown = document.getElementById('search-cat-dropdown');
    const searchSuggestionsBox = document.getElementById('search-suggestions-box');

    // Menú Lateral Amazon (Sliding Drawer)
    const btnAmazonMenu = document.getElementById('btn-amazon-menu');
    const amazonSideMenu = document.getElementById('amazon-side-menu');
    const amazonSideBackdrop = document.getElementById('amazon-side-backdrop');
    const btnCloseSideMenu = document.getElementById('btn-close-side-menu');
    const sideMenuCategoriesList = document.getElementById('side-menu-categories-list');
    const sideMenuBrandsList = document.getElementById('side-menu-brands-list');

    // YMM Garage Selects
    const ymmBrand = document.getElementById('ymm-brand');
    const ymmModel = document.getElementById('ymm-model');
    const btnApplyYmm = document.getElementById('btn-apply-ymm');
    const btnResetYmm = document.getElementById('btn-reset-ymm');
    const activeMotorcycleBadge = document.getElementById('active-motorcycle-badge');
    const filterBikeName = document.getElementById('filter-bike-name');
    const btnRemoveBikeFilter = document.getElementById('btn-remove-bike-filter');

    // Categorias & Filtros Sidebar
    const categoriesContainer = document.getElementById('categories-container');
    const selectSort = document.getElementById('select-sort');
    const filterOffersOnly = document.getElementById('filter-offers-only');
    const filterMinPrice = document.getElementById('filter-min-price');
    const filterMaxPrice = document.getElementById('filter-max-price');
    const btnApplyPrice = document.getElementById('btn-apply-price');

    // Carrito
    const btnOpenCart = document.getElementById('btn-open-cart');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartBadge = document.getElementById('cart-badge');
    const cartHeaderTotal = document.getElementById('cart-header-total');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartDrawerSubtotal = document.getElementById('cart-drawer-subtotal');
    const cartDrawerTotal = document.getElementById('cart-drawer-total');
    const btnProceedCheckout = document.getElementById('btn-proceed-checkout');

    // Checkout Modal
    const checkoutModal = document.getElementById('checkout-modal');
    const btnCloseCheckout = document.getElementById('btn-close-checkout');
    const checkoutForm = document.getElementById('checkout-form');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const transferPanel = document.getElementById('transfer-panel');
    const bankReceiptFile = document.getElementById('bank-receipt-file');
    const receiptPreviewBox = document.getElementById('receipt-preview-box');
    const receiptPreviewImg = document.getElementById('receipt-preview-img');

    // Success Modal
    const successModal = document.getElementById('success-modal');
    const successOrderCode = document.getElementById('success-order-code');
    const successOrderTotal = document.getElementById('success-order-total');
    const btnWhatsappConfirm = document.getElementById('btn-whatsapp-confirm');
    const btnSuccessClose = document.getElementById('btn-success-close');
    const btnSuccessTrack = document.getElementById('btn-success-track');

    // Ficha Tecnica / Amazon Buy Box Modal
    const productModal = document.getElementById('product-modal');
    const btnCloseProductModal = document.getElementById('btn-close-product-modal');
    const mpImgContainer = document.getElementById('mp-img-container');
    const mpTitle = document.getElementById('mp-title');
    const mpBrandTag = document.getElementById('mp-brand-tag');
    const mpRatingContainer = document.getElementById('mp-rating-container');
    const mpCompat = document.getElementById('mp-compat');
    const mpCode = document.getElementById('mp-code');
    const mpPrice = document.getElementById('mp-price');
    const mpOldPrice = document.getElementById('mp-old-price');
    const mpStock = document.getElementById('mp-stock');
    const mpDesc = document.getElementById('mp-desc');
    const mpQtyValue = document.getElementById('mp-qty-value');
    const btnQtyMinus = document.getElementById('btn-qty-minus');
    const btnQtyPlus = document.getElementById('btn-qty-plus');
    const btnAddModalCart = document.getElementById('btn-add-modal-cart');
    const btnBuyNow = document.getElementById('btn-buy-now');
    const btnModalWhatsapp = document.getElementById('btn-modal-whatsapp');

    // Rastreo
    const trackModal = document.getElementById('track-modal');
    const btnQuickTrack = document.getElementById('btn-quick-track');
    const btnCloseTrack = document.getElementById('btn-close-track');
    const trackForm = document.getElementById('track-form');
    const trackInput = document.getElementById('track-input');
    const trackResultBox = document.getElementById('track-result-box');

    let modalQty = 1;

    // -------------------------------------------------------------
    // 3. SISTEMA DE TOAST NOTIFICATIONS
    // -------------------------------------------------------------
    function showToast(message, type = 'success') {
        const container = document.getElementById('delta-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `delta-toast ${type}`;
        const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : 'ℹ️');
        toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }

    // -------------------------------------------------------------
    // 4. INICIALIZACION Y CARGA DE VECTORES SVG
    // -------------------------------------------------------------
    init();

    async function init() {
        injectCustomSvgIcons();
        updateCartUI();
        startFlashDealCountdown();

        await Promise.all([
            loadCategories(),
            loadBrands(),
            loadMotorcycles(),
            fetchProducts()
        ]);

        setupEventListeners();
    }

    function injectCustomSvgIcons() {
        if (!window.DeltaIcons) return;

        const setSvg = (id, svg) => {
            const el = document.getElementById(id);
            if (el && svg) el.innerHTML = svg;
        };

        setSvg('header-logo-container', window.DeltaIcons.logo);
        setSvg('deliver-pin-container', window.DeltaIcons.locationPin);
        setSvg('search-icon-container', window.DeltaIcons.amazonSearch);
        setSvg('cart-icon-svg-container', window.DeltaIcons.amazonCart);
        setSvg('amazon-menu-icon-container', window.DeltaIcons.amazonMenu);
        setSvg('garage-icon-container', window.DeltaIcons.garageMoto);
        setSvg('shield-icon-container', window.DeltaIcons.shieldCheck);

        // Tiles
        setSvg('tile-icon-piston', window.DeltaIcons.parts.piston);
        setSvg('tile-icon-brake', window.DeltaIcons.parts.brake);
        setSvg('tile-icon-chain', window.DeltaIcons.parts.chain);
        setSvg('tile-icon-electric', window.DeltaIcons.parts.electric);
        setSvg('tile-icon-oil', window.DeltaIcons.parts.oil);
        setSvg('tile-icon-tire', window.DeltaIcons.parts.tire);
        setSvg('tile-icon-helmet', window.DeltaIcons.parts.helmet);
        setSvg('tile-icon-suspension', window.DeltaIcons.parts.suspension);
        setSvg('deal-img-container', window.DeltaIcons.parts.piston);
    }

    async function safeFetch(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return Array.isArray(data) ? data : (data.data || data.products || data.categories || data.brands || []);
        } catch (e) {
            console.warn(`Fallo al cargar ${url}:`, e);
            return [];
        }
    }

    // -------------------------------------------------------------
    // 5. CARGA DE CATEGORÍAS & MARCAS
    // -------------------------------------------------------------
    async function loadCategories() {
        state.categories = await safeFetch('/api/categories');
        renderCategories();
        populateSearchDropdown();
        populateSideMenuCategories();
    }

    async function loadBrands() {
        state.brands = await safeFetch('/api/brands');
        renderBrandSelect();
        populateSideMenuBrands();
    }

    async function loadMotorcycles() {
        state.motorcycles = await safeFetch('/api/motorcycles');
    }

    function populateSearchDropdown() {
        if (!searchCatDropdown) return;
        searchCatDropdown.innerHTML = '<option value="">Todos los repuestos</option>';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.slug || cat.id;
            opt.textContent = cat.nombre;
            searchCatDropdown.appendChild(opt);
        });
    }

    function renderCategories() {
        if (!categoriesContainer) return;
        categoriesContainer.innerHTML = '';

        // Botón "Todas las Categorías"
        const allBtn = document.createElement('button');
        allBtn.className = 'category-pill active';
        allBtn.innerHTML = '<span>🏍️</span> Todas las Piezas';
        allBtn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            state.selectedCategory = '';
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            allBtn.classList.add('active');
            fetchProducts();
        });
        categoriesContainer.appendChild(allBtn);

        state.categories.forEach(cat => {
            const pill = document.createElement('button');
            pill.className = 'category-pill';
            pill.innerHTML = `<span class="cat-pill-icon">${cat.icono || '🔧'}</span> ${cat.nombre}`;
            pill.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playClick();
                state.selectedCategory = cat.slug || cat.id;
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                fetchProducts();
            });
            categoriesContainer.appendChild(pill);
        });
    }

    function populateSideMenuCategories() {
        if (!sideMenuCategoriesList) return;
        sideMenuCategoriesList.innerHTML = '';
        state.categories.forEach(cat => {
            const a = document.createElement('a');
            a.className = 'side-menu-link';
            a.href = '#catalogo';
            a.innerHTML = `<span>${cat.icono || '📦'}</span> ${cat.nombre}`;
            a.addEventListener('click', () => {
                closeSideMenu();
                state.selectedCategory = cat.slug || cat.id;
                fetchProducts();
            });
            sideMenuCategoriesList.appendChild(a);
        });
    }

    function populateSideMenuBrands() {
        if (!sideMenuBrandsList) return;
        sideMenuBrandsList.innerHTML = '';
        state.brands.forEach(b => {
            const a = document.createElement('a');
            a.className = 'side-menu-link';
            a.href = '#catalogo';
            a.innerHTML = `<span>🏍️</span> ${b.nombre}`;
            a.addEventListener('click', () => {
                closeSideMenu();
                state.searchQuery = b.nombre;
                fetchProducts();
            });
            sideMenuBrandsList.appendChild(a);
        });
    }

    // -------------------------------------------------------------
    // 6. SELECTOR YMM (TU GARAJE DELTASTORE)
    // -------------------------------------------------------------
    function renderBrandSelect() {
        if (!ymmBrand) return;
        ymmBrand.innerHTML = '<option value="">1. Seleccionar Marca de Moto...</option>';
        state.brands.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.nombre;
            ymmBrand.appendChild(opt);
        });
    }

    if (ymmBrand) {
        ymmBrand.addEventListener('change', () => {
            const brandId = parseInt(ymmBrand.value);
            ymmModel.innerHTML = '<option value="">2. Seleccionar Modelo...</option>';
            if (!brandId) {
                ymmModel.disabled = true;
                return;
            }

            const filteredModels = state.motorcycles.filter(m => m.marca_id === brandId || m.marca_moto_id === brandId);
            if (filteredModels.length > 0) {
                filteredModels.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.nombre;
                    opt.textContent = `${m.nombre} (${m.cilindrada || 'Universal'})`;
                    ymmModel.appendChild(opt);
                });
            } else {
                const brandName = ymmBrand.options[ymmBrand.selectedIndex]?.text || '';
                const defaults = {
                    'Bajaj': ['Pulsar NS200', 'Pulsar 180', 'Discover 125', 'Boxer BM150'],
                    'Yamaha': ['FZ16', 'FZ 2.0', 'Crypton 115', 'YBR 125', 'XTZ 125'],
                    'Honda': ['CG 125', 'XR 150L', 'CB 125F', 'CRF 250'],
                    'Suzuki': ['Gixxer 150', 'GN 125', 'AX 100', 'GZ 150'],
                    'Genesis': ['HJ 125', 'GXT 200', 'SX 250'],
                    'Serpento': ['Yara 200', 'Coral 150', 'Naja 150']
                };
                const list = defaults[brandName] || ['Universal / Todas'];
                list.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    ymmModel.appendChild(opt);
                });
            }
            ymmModel.disabled = false;
        });
    }

    if (btnApplyYmm) {
        btnApplyYmm.addEventListener('click', () => {
            const brandText = ymmBrand.options[ymmBrand.selectedIndex]?.text || '';
            const modelVal = ymmModel.value;

            if (!ymmBrand.value && !modelVal) {
                alert('Por favor selecciona una marca de motocicleta.');
                return;
            }

            state.selectedMotorcycle = {
                brand: brandText,
                model: modelVal,
                label: `${brandText} ${modelVal ? '• ' + modelVal : ''}`
            };

            filterBikeName.textContent = state.selectedMotorcycle.label;
            activeMotorcycleBadge.style.display = 'inline-flex';
            if (btnResetYmm) btnResetYmm.style.display = 'inline-block';

            if (window.soundEngine) window.soundEngine.playSuccess();
            showToast(`Filtro de Garaje activado: ${state.selectedMotorcycle.label}`, 'success');
            fetchProducts();
        });
    }

    function clearYmm() {
        state.selectedMotorcycle = null;
        if (activeMotorcycleBadge) activeMotorcycleBadge.style.display = 'none';
        if (btnResetYmm) btnResetYmm.style.display = 'none';
        if (ymmBrand) ymmBrand.value = '';
        if (ymmModel) {
            ymmModel.innerHTML = '<option value="">2. Seleccionar Modelo...</option>';
            ymmModel.disabled = true;
        }
        showToast('Filtro de garaje desactivado. Mostrando todos los repuestos.', 'warning');
        fetchProducts();
    }

    if (btnResetYmm) btnResetYmm.addEventListener('click', clearYmm);
    if (btnRemoveBikeFilter) btnRemoveBikeFilter.addEventListener('click', clearYmm);

    // -------------------------------------------------------------
    // 7. OBTENCIÓN Y RENDERIZADO DE PRODUCTOS (AMAZON STYLE)
    // -------------------------------------------------------------
    async function fetchProducts() {
        if (resultsCount) resultsCount.textContent = 'Buscando repuestos...';
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="product-skeleton-card"></div>
                <div class="product-skeleton-card"></div>
                <div class="product-skeleton-card"></div>
                <div class="product-skeleton-card"></div>
            `;
        }

        const params = new URLSearchParams();
        if (state.searchQuery) params.append('search', state.searchQuery);
        if (state.selectedCategory) params.append('categoria', state.selectedCategory);
        if (state.minPrice) params.append('min_precio', state.minPrice);
        if (state.maxPrice) params.append('max_precio', state.maxPrice);

        if (state.selectedMotorcycle && state.selectedMotorcycle.model) {
            params.append('search', state.selectedMotorcycle.model);
        } else if (state.selectedMotorcycle && state.selectedMotorcycle.brand) {
            params.append('search', state.selectedMotorcycle.brand);
        }

        const url = `/api/products?${params.toString()}`;
        let products = await safeFetch(url);

        if (!products || products.length === 0) {
            products = await safeFetch('/api/products');
        }

        state.products = products;
        applyLocalSortingAndRender();
        renderCrossSelling();
    }

    function applyLocalSortingAndRender() {
        let items = [...state.products];

        if (state.offersOnly) {
            items = items.filter(p => p.precio_oferta && Number(p.precio_oferta) > 0);
        }

        switch (state.sortBy) {
            case 'price-asc':
                items.sort((a, b) => Number(a.precio_oferta || a.precio || 0) - Number(b.precio_oferta || b.precio || 0));
                break;
            case 'price-desc':
                items.sort((a, b) => Number(b.precio_oferta || b.precio || 0) - Number(a.precio_oferta || a.precio || 0));
                break;
            case 'name-asc':
                items.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
                break;
            case 'rating-desc':
                items.sort((a, b) => (b.id % 5) - (a.id % 5));
                break;
            default:
                items.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
                break;
        }

        renderProducts(items);
    }

    function renderProducts(items) {
        if (!productsGrid) return;
        productsGrid.innerHTML = '';

        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${items.length} repuestos disponibles en Juigalpa`;
        }

        if (items.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #0c1424; border-radius: 12px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
                    <h3 style="color:#ffffff; margin-bottom: 6px;">No se encontraron repuestos con los filtros aplicados</h3>
                    <p style="color:#94a3b8; font-size: 0.9rem;">Prueba buscando por marca de moto, código genérico o limpiando el filtro de búsqueda.</p>
                </div>
            `;
            return;
        }

        items.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'amazon-product-card';

            const priceNum = Number(p.precio_oferta || p.precio || 0);
            const hasOffer = p.precio_oferta && Number(p.precio_oferta) < Number(p.precio);
            const discountPct = hasOffer ? Math.round(((p.precio - p.precio_oferta) / p.precio) * 100) : 0;
            const fakeRating = 4.6 + ((p.id * 7) % 5) * 0.08;
            const reviewCount = 42 + ((p.id * 13) % 90);

            const hasBase64 = p.imagen_base64 && p.imagen_base64.startsWith('data:image');
            const fallbackSvg = window.DeltaIcons ? window.DeltaIcons.getPartSvg(p.categoria_slug || p.categoria_nombre, p.nombre) : '';

            // Badges Amazon
            let topBadge = '';
            if (p.destacado) {
                topBadge = '<span class="badge-amazon-choice">OPCIÓN DELTASTORE</span>';
            } else if (idx % 3 === 0) {
                topBadge = '<span class="badge-bestseller">MÁS VENDIDO</span>';
            }

            card.innerHTML = `
                <div class="card-top-badges">
                    ${topBadge}
                    ${hasOffer ? `<span class="badge-deal">-${discountPct}% OFERTA</span>` : ''}
                </div>
                <div class="card-img-wrapper" title="Ver ficha técnica">
                    ${hasBase64 
                        ? `<img src="${p.imagen_base64}" alt="${p.nombre}" loading="lazy">`
                        : `<div style="width:72px; height:72px;">${fallbackSvg}</div>`
                    }
                </div>
                <div class="card-details">
                    <span class="card-category-brand">${p.marca_nombre || 'GENUINO'} &bull; ${p.categoria_nombre || 'REPUESTO'}</span>
                    <h3 class="card-title" title="${p.nombre}">${p.nombre}</h3>
                    
                    <div class="card-rating-row">
                        ${window.DeltaIcons ? window.DeltaIcons.getStars(fakeRating) : '★★★★★'}
                        <span class="rating-count-text">(${reviewCount})</span>
                    </div>

                    <div class="card-delivery-promise">
                        <span>⚡</span> Recíbelo <strong>HOY GRATIS</strong> en Juigalpa
                    </div>

                    <div class="card-pricing-block">
                        <span class="price-symbol">C$</span>
                        <span class="price-main">${priceNum.toFixed(2)}</span>
                        ${hasOffer ? `<span class="price-old">C$ ${Number(p.precio).toFixed(2)}</span>` : ''}
                    </div>

                    <div class="card-actions-row">
                        <button class="btn-card-add-cart" title="Agregar al carrito de compras">
                            <span>🛒</span> Agregar
                        </button>
                        <button class="btn-card-quickview" title="Ver ficha técnica completa">
                            Ver
                        </button>
                    </div>
                </div>
            `;

            // Eventos
            card.querySelector('.btn-card-add-cart').addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart(p, 1);
            });

            card.querySelector('.card-img-wrapper').addEventListener('click', () => openProductModal(p));
            card.querySelector('.card-title').addEventListener('click', () => openProductModal(p));
            card.querySelector('.btn-card-quickview').addEventListener('click', () => openProductModal(p));

            productsGrid.appendChild(card);
        });
    }

    // -------------------------------------------------------------
    // 8. CARRUSEL CROSS-SELLING RECOMENDADOS AMAZON
    // -------------------------------------------------------------
    function renderCrossSelling() {
        const container = document.getElementById('cross-selling-grid');
        if (!container || state.products.length === 0) return;

        container.innerHTML = '';
        const cross = [...state.products].reverse().slice(0, 6);

        cross.forEach(p => {
            const tile = document.createElement('div');
            tile.className = 'mini-cross-tile';
            tile.style.cssText = 'background: #090f1d; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; min-width: 170px; cursor: pointer; text-align: center;';

            const priceNum = Number(p.precio_oferta || p.precio || 0);
            const hasBase64 = p.imagen_base64 && p.imagen_base64.startsWith('data:image');
            const fallbackSvg = window.DeltaIcons ? window.DeltaIcons.getPartSvg(p.categoria_slug, p.nombre) : '';

            tile.innerHTML = `
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    ${hasBase64 ? `<img src="${p.imagen_base64}" style="max-height: 100%; max-width: 100%; object-fit: contain;">` : `<div style="width: 40px; height: 40px;">${fallbackSvg}</div>`}
                </div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${p.nombre}</div>
                <div style="color: var(--amazon-gold); font-weight: 800; font-size: 0.85rem;">C$ ${priceNum.toFixed(2)}</div>
            `;

            tile.addEventListener('click', () => openProductModal(p));
            container.appendChild(tile);
        });
    }

    // -------------------------------------------------------------
    // 9. LOGICA DEL CARRITO (REACTIVO & ZERO-CRASH)
    // -------------------------------------------------------------
    function addToCart(product, quantity = 1) {
        const prodId = product.id || product.product_id;
        const existing = state.cart.find(it => it.product_id === prodId || it.id === prodId);

        const price = Number(product.precio_oferta || product.precio || 0);
        const name = product.nombre || product.name || 'Repuesto de Moto';
        const image = product.imagen_base64 || product.image || '';
        const category = product.categoria_slug || product.category || '';
        const code = product.codigo || product.code || 'REP-' + prodId;

        if (existing) {
            existing.quantity += quantity;
        } else {
            state.cart.push({
                id: prodId,
                product_id: prodId,
                name: name,
                code: code,
                price: price,
                image: image,
                category: category,
                quantity: quantity
            });
        }

        saveCart();
        updateCartUI();

        if (window.soundEngine) window.soundEngine.playAddToCart();
        showToast(`¡Agregado al carrito: ${name}! (C$ ${price.toFixed(2)})`, 'success');

        // Efecto rebote en badge
        if (cartBadge) {
            cartBadge.classList.add('bounce');
            setTimeout(() => cartBadge.classList.remove('bounce'), 450);
        }
    }

    function saveCart() {
        localStorage.setItem('deltastore_cart', JSON.stringify(state.cart));
    }

    function updateCartUI() {
        const totalItems = state.cart.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
        const totalPrice = state.cart.reduce((acc, it) => acc + (Number(it.price || 0) * (Number(it.quantity) || 1)), 0);

        if (cartBadge) cartBadge.textContent = totalItems;
        if (cartHeaderTotal) cartHeaderTotal.textContent = `C$ ${totalPrice.toFixed(2)}`;
        if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = `C$ ${totalPrice.toFixed(2)}`;
        if (cartDrawerTotal) cartDrawerTotal.textContent = `C$ ${totalPrice.toFixed(2)}`;
        if (summarySubtotal) summarySubtotal.textContent = `C$ ${totalPrice.toFixed(2)}`;
        if (summaryTotal) summaryTotal.textContent = `C$ ${totalPrice.toFixed(2)}`;

        renderCartDrawerItems();
    }

    function renderCartDrawerItems() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';

        if (state.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align:center; padding: 40px 10px; color: #64748b;">
                    <div style="font-size: 2.8rem; margin-bottom: 8px;">🛵</div>
                    <p style="color:#ffffff; font-weight:700; margin-bottom:4px;">Tu carrito está vacío</p>
                    <small>Explora piezas de motor, frenos o aceites para tu moto.</small>
                </div>
            `;
            if (btnProceedCheckout) {
                btnProceedCheckout.disabled = true;
                btnProceedCheckout.style.opacity = '0.5';
            }
            return;
        }

        if (btnProceedCheckout) {
            btnProceedCheckout.disabled = false;
            btnProceedCheckout.style.opacity = '1';
        }

        state.cart.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';

            const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
            const hasBase64 = item.image && item.image.startsWith('data:image');
            const fallbackSvg = window.DeltaIcons ? window.DeltaIcons.getPartSvg(item.category, item.name) : '';

            row.innerHTML = `
                <div style="width:50px; height:50px; display:flex; align-items:center; justify-content:center; background:#080d19; border-radius:6px; overflow:hidden; flex-shrink:0;">
                    ${hasBase64 
                        ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img">`
                        : `<div style="width:36px; height:36px;">${fallbackSvg}</div>`
                    }
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">C$ ${lineTotal.toFixed(2)}</span>
                    <div class="cart-item-stepper">
                        <button class="qty-btn btn-minus">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn btn-plus">+</button>
                    </div>
                </div>
                <button class="btn-remove-cart" title="Eliminar">&times;</button>
            `;

            row.querySelector('.btn-minus').addEventListener('click', () => {
                if (item.quantity > 1) {
                    item.quantity--;
                } else {
                    state.cart.splice(index, 1);
                }
                saveCart();
                updateCartUI();
            });

            row.querySelector('.btn-plus').addEventListener('click', () => {
                item.quantity++;
                saveCart();
                updateCartUI();
            });

            row.querySelector('.btn-remove-cart').addEventListener('click', () => {
                state.cart.splice(index, 1);
                saveCart();
                updateCartUI();
                showToast(`Eliminado del carrito: ${item.name}`, 'warning');
            });

            cartItemsContainer.appendChild(row);
        });
    }

    function openCartDrawer() {
        if (cartDrawer) cartDrawer.classList.add('open');
        if (cartBackdrop) cartBackdrop.classList.add('open');
    }

    function closeCartDrawer() {
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (cartBackdrop) cartBackdrop.classList.remove('open');
    }

    if (btnOpenCart) btnOpenCart.addEventListener('click', openCartDrawer);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

    // -------------------------------------------------------------
    // 10. MODAL BUY BOX AMAZON-STYLE
    // -------------------------------------------------------------
    function openProductModal(p) {
        state.activeProductModal = p;
        modalQty = 1;

        if (mpTitle) mpTitle.textContent = p.nombre;
        if (mpBrandTag) mpBrandTag.textContent = `${p.marca_nombre || 'GENUINO'} &bull; ${p.categoria_nombre || 'REPUESTO'}`;
        if (mpCode) mpCode.textContent = p.codigo || 'REP-' + p.id;
        if (mpCompat) mpCompat.textContent = p.modelo_compatible || 'Universal';

        const priceNum = Number(p.precio_oferta || p.precio || 0);
        if (mpPrice) mpPrice.textContent = priceNum.toFixed(2);
        if (mpOldPrice) {
            mpOldPrice.textContent = p.precio_oferta ? `C$ ${Number(p.precio).toFixed(2)}` : '';
        }

        if (mpStock) {
            mpStock.innerHTML = p.stock > 0 
                ? `<span style="color:var(--accent-green); font-weight:700;">🟢 ${p.stock} unidades en stock Juigalpa</span>`
                : `<span style="color:var(--accent-rose); font-weight:700;">🔴 Agotado temporalmente</span>`;
        }

        if (mpRatingContainer) {
            const fakeRating = 4.7 + ((p.id * 3) % 4) * 0.08;
            mpRatingContainer.innerHTML = `
                ${window.DeltaIcons ? window.DeltaIcons.getStars(fakeRating) : '★★★★★'}
                <span class="pview-review-count">94 calificaciones verificadas</span>
            `;
        }

        if (mpDesc) {
            mpDesc.textContent = p.descripcion || 'Repuesto genuino de alta durabilidad y rendimiento garantizado para tu motocicleta en Juigalpa, Chontales.';
        }

        if (mpQtyValue) mpQtyValue.textContent = modalQty;

        if (mpImgContainer) {
            const hasBase64 = p.imagen_base64 && p.imagen_base64.startsWith('data:image');
            const fallbackSvg = window.DeltaIcons ? window.DeltaIcons.getPartSvg(p.categoria_slug, p.nombre) : '';
            mpImgContainer.innerHTML = hasBase64
                ? `<img src="${p.imagen_base64}" alt="${p.nombre}" style="max-width:100%; max-height:260px; object-fit:contain;">`
                : `<div style="width:160px; height:160px;">${fallbackSvg}</div>`;
        }

        if (btnModalWhatsapp) {
            btnModalWhatsapp.onclick = () => {
                const text = encodeURIComponent(`¡Hola DeltaStore Juigalpa! Me interesa el repuesto: ${p.nombre} (Código: ${p.codigo || p.id}). ¿Tienen despacho inmediato?`);
                window.open(`https://wa.me/50588889999?text=${text}`, '_blank');
            };
        }

        if (productModal) productModal.classList.add('open');
    }

    if (btnQtyMinus) {
        btnQtyMinus.addEventListener('click', () => {
            if (modalQty > 1) {
                modalQty--;
                if (mpQtyValue) mpQtyValue.textContent = modalQty;
            }
        });
    }

    if (btnQtyPlus) {
        btnQtyPlus.addEventListener('click', () => {
            modalQty++;
            if (mpQtyValue) mpQtyValue.textContent = modalQty;
        });
    }

    if (btnAddModalCart) {
        btnAddModalCart.addEventListener('click', () => {
            if (state.activeProductModal) {
                addToCart(state.activeProductModal, modalQty);
                if (productModal) productModal.classList.remove('open');
            }
        });
    }

    if (btnBuyNow) {
        btnBuyNow.addEventListener('click', () => {
            if (state.activeProductModal) {
                addToCart(state.activeProductModal, modalQty);
                if (productModal) productModal.classList.remove('open');
                closeCartDrawer();
                if (checkoutModal) checkoutModal.classList.add('open');
            }
        });
    }

    if (btnCloseProductModal) {
        btnCloseProductModal.addEventListener('click', () => {
            if (productModal) productModal.classList.remove('open');
        });
    }

    // -------------------------------------------------------------
    // 11. CHECKOUT JUIGALPA & PROCESAMIENTO DE ORDEN
    // -------------------------------------------------------------
    if (btnProceedCheckout) {
        btnProceedCheckout.addEventListener('click', () => {
            closeCartDrawer();
            if (checkoutModal) checkoutModal.classList.add('open');
        });
    }

    if (btnCloseCheckout) {
        btnCloseCheckout.addEventListener('click', () => {
            if (checkoutModal) checkoutModal.classList.remove('open');
        });
    }

    // Métodos de pago
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            const val = radio.value;
            if (transferPanel) transferPanel.style.display = val === 'transferencia_bancaria' ? 'block' : 'none';
        });
    });

    // Copiar cuentas bancarias
    document.querySelectorAll('.btn-copy-account').forEach(btn => {
        btn.addEventListener('click', () => {
            const acc = btn.dataset.account;
            navigator.clipboard.writeText(acc).then(() => {
                const orig = btn.textContent;
                btn.textContent = '¡Copiado!';
                setTimeout(() => btn.textContent = orig, 1500);
            });
        });
    });

    // Subida de comprobante
    if (bankReceiptFile) {
        bankReceiptFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                state.receiptBase64 = event.target.result;
                if (receiptPreviewImg) receiptPreviewImg.src = state.receiptBase64;
                if (receiptPreviewBox) receiptPreviewBox.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    // Formulario de Checkout
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit-order');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<span>⏳ Confirmando Pedido...</span>';
            }

            const paymentRadio = document.querySelector('input[name="metodo_pago"]:checked');
            const method = paymentRadio ? paymentRadio.value : 'contra_entrega';

            const payload = {
                cliente_nombre: document.getElementById('cust-name').value.trim(),
                cliente_telefono: document.getElementById('cust-phone').value.trim(),
                cliente_email: document.getElementById('cust-email')?.value.trim() || 'cliente@deltastore.com',
                direccion_exacta: document.getElementById('cust-address').value.trim(),
                punto_referencia: document.getElementById('cust-reference').value.trim(),
                municipio: 'Juigalpa',
                departamento: 'Chontales',
                tipo_entrega: 'domicilio_gratis_juigalpa',
                metodo_pago: method,
                comprobante_pago_base64: state.receiptBase64,
                notas_cliente: document.getElementById('cust-notes')?.value.trim() || '',
                items: state.cart.map(it => ({
                    producto_id: it.product_id || it.id,
                    cantidad: it.quantity
                }))
            };

            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success || data.numero_orden) {
                    const orderNum = data.numero_orden || ('ORD-' + Date.now().toString().slice(-4));
                    const orderTotal = data.total || state.cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);

                    state.cart = [];
                    saveCart();
                    updateCartUI();

                    if (checkoutModal) checkoutModal.classList.remove('open');
                    if (window.soundEngine) window.soundEngine.playCheckout();
                    if (window.triggerConfetti) window.triggerConfetti();

                    if (successOrderCode) successOrderCode.textContent = orderNum;
                    if (successOrderTotal) successOrderTotal.textContent = `C$ ${Number(orderTotal).toFixed(2)}`;

                    if (btnWhatsappConfirm) {
                        const msg = encodeURIComponent(`¡Hola DeltaStore Juigalpa! Acabo de registrar el pedido ${orderNum} por C$ ${Number(orderTotal).toFixed(2)}. Mi dirección es: ${payload.direccion_exacta} (${payload.punto_referencia}). Tel: ${payload.cliente_telefono}`);
                        btnWhatsappConfirm.onclick = () => window.open(`https://wa.me/50588889999?text=${msg}`, '_blank');
                    }

                    if (btnSuccessTrack) {
                        btnSuccessTrack.onclick = () => {
                            if (successModal) successModal.classList.remove('open');
                            openTrackingWithCode(orderNum);
                        };
                    }

                    if (successModal) successModal.classList.add('open');
                } else {
                    alert('Error al registrar pedido: ' + (data.message || data.error || 'Verifique stock disponible.'));
                }
            } catch (err) {
                console.error('Error enviando orden:', err);
                alert('No se pudo conectar con el servidor.');
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<span>🚀 Confirmar y Enviar Pedido (Envío Gratis)</span>';
                }
            }
        });
    }

    if (btnSuccessClose) {
        btnSuccessClose.addEventListener('click', () => {
            if (successModal) successModal.classList.remove('open');
        });
    }

    // -------------------------------------------------------------
    // 12. RASTREO DE PEDIDOS
    // -------------------------------------------------------------
    function openTrackingWithCode(code) {
        if (trackInput) trackInput.value = code;
        if (trackModal) trackModal.classList.add('open');
        performTrack(code);
    }

    if (btnQuickTrack) {
        btnQuickTrack.addEventListener('click', (e) => {
            e.preventDefault();
            if (trackModal) trackModal.classList.add('open');
        });
    }

    const btnNavOrders = document.getElementById('btn-nav-orders');
    if (btnNavOrders) {
        btnNavOrders.addEventListener('click', () => {
            if (trackModal) trackModal.classList.add('open');
        });
    }

    if (btnCloseTrack) {
        btnCloseTrack.addEventListener('click', () => {
            if (trackModal) trackModal.classList.remove('open');
        });
    }

    if (trackForm) {
        trackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = trackInput.value.trim();
            if (val) performTrack(val);
        });
    }

    async function performTrack(code) {
        if (!trackResultBox) return;
        trackResultBox.style.display = 'block';
        trackResultBox.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:18px;">Consultando despacho...</div>';

        try {
            const res = await fetch(`/api/orders/track/${encodeURIComponent(code)}`);
            const data = await res.json();

            if (data.success && (data.order || data.data)) {
                const ord = data.order || data.data;
                const statusMap = {
                    nuevo: { label: 'Pedido Registrado', step: 1 },
                    confirmado: { label: 'En Preparación en Taller', step: 2 },
                    en_preparacion: { label: 'En Empaque / Verificación', step: 2 },
                    en_ruta: { label: 'En Ruta con Motorizado Juigalpa', step: 3 },
                    entregado: { label: 'Entregado con Éxito', step: 4 },
                    cancelado: { label: 'Cancelado', step: 0 }
                };

                const currentInfo = statusMap[ord.estado] || { label: ord.estado, step: 1 };

                trackResultBox.innerHTML = `
                    <div style="background:#090f1d; border:1px solid var(--border-cyan); border-radius:8px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <strong>Orden: ${ord.numero_orden}</strong>
                            <span style="color:var(--primary); font-weight:700;">${currentInfo.label}</span>
                        </div>
                        <div style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:8px;">
                            Cliente: ${ord.cliente_nombre} &bull; Total: C$ ${Number(ord.total).toFixed(2)}
                        </div>
                        <div style="font-size:0.82rem; color:var(--text-muted);">
                            Destino: ${ord.direccion_exacta} (${ord.municipio})
                        </div>
                        ${ord.repartidor_asignado ? `<div style="margin-top:6px; color:var(--amazon-gold); font-size:0.82rem;">🛵 Repartidor: ${ord.repartidor_asignado}</div>` : ''}
                    </div>
                `;
            } else {
                trackResultBox.innerHTML = '<div style="color:#ef4444; text-align:center; padding:18px;">No se encontró ningún pedido con ese código en Juigalpa.</div>';
            }
        } catch (e) {
            trackResultBox.innerHTML = '<div style="color:#ef4444; text-align:center; padding:18px;">Error al conectar con el servidor de rastreo.</div>';
        }
    }

    // -------------------------------------------------------------
    // 13. MENÚ LATERAL AMAZON & BÚSQUEDA EN VIVO
    // -------------------------------------------------------------
    function openSideMenu() {
        if (amazonSideMenu) amazonSideMenu.classList.add('open');
        if (amazonSideBackdrop) amazonSideBackdrop.classList.add('open');
    }

    function closeSideMenu() {
        if (amazonSideMenu) amazonSideMenu.classList.remove('open');
        if (amazonSideBackdrop) amazonSideBackdrop.classList.remove('open');
    }

    if (btnAmazonMenu) btnAmazonMenu.addEventListener('click', openSideMenu);
    if (btnCloseSideMenu) btnCloseSideMenu.addEventListener('click', closeSideMenu);
    if (amazonSideBackdrop) amazonSideBackdrop.addEventListener('click', closeSideMenu);

    // Búsqueda en vivo
    if (mainSearchInput) {
        mainSearchInput.addEventListener('input', () => {
            const val = mainSearchInput.value.trim();
            if (btnClearSearch) btnClearSearch.style.display = val ? 'block' : 'none';

            if (val.length >= 2) {
                const matches = state.products.filter(p => 
                    p.nombre.toLowerCase().includes(val.toLowerCase()) || 
                    (p.modelo_compatible && p.modelo_compatible.toLowerCase().includes(val.toLowerCase()))
                ).slice(0, 5);

                if (matches.length > 0 && searchSuggestionsBox) {
                    searchSuggestionsBox.innerHTML = '';
                    matches.forEach(m => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        item.innerHTML = `
                            <span>🔍</span>
                            <div style="flex:1;"><strong>${m.nombre}</strong> <small style="color:var(--text-muted);">(${m.modelo_compatible || 'Universal'})</small></div>
                            <span style="color:var(--amazon-gold); font-weight:700;">C$ ${Number(m.precio_oferta || m.precio).toFixed(2)}</span>
                        `;
                        item.addEventListener('click', () => {
                            mainSearchInput.value = m.nombre;
                            searchSuggestionsBox.style.display = 'none';
                            state.searchQuery = m.nombre;
                            fetchProducts();
                        });
                        searchSuggestionsBox.appendChild(item);
                    });
                    searchSuggestionsBox.style.display = 'block';
                } else if (searchSuggestionsBox) {
                    searchSuggestionsBox.style.display = 'none';
                }
            } else if (searchSuggestionsBox) {
                searchSuggestionsBox.style.display = 'none';
            }
        });

        mainSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (searchSuggestionsBox) searchSuggestionsBox.style.display = 'none';
                state.searchQuery = mainSearchInput.value.trim();
                fetchProducts();
            }
        });
    }

    if (btnMainSearch) {
        btnMainSearch.addEventListener('click', () => {
            if (searchSuggestionsBox) searchSuggestionsBox.style.display = 'none';
            state.searchQuery = mainSearchInput.value.trim();
            fetchProducts();
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            mainSearchInput.value = '';
            btnClearSearch.style.display = 'none';
            if (searchSuggestionsBox) searchSuggestionsBox.style.display = 'none';
            state.searchQuery = '';
            fetchProducts();
        });
    }

    if (searchCatDropdown) {
        searchCatDropdown.addEventListener('change', () => {
            state.selectedCategory = searchCatDropdown.value;
            fetchProducts();
        });
    }

    // Subnav links
    document.querySelectorAll('.subnav-link').forEach(link => {
        link.addEventListener('click', () => {
            const filter = link.dataset.filter;
            if (filter === 'ofertas') {
                state.offersOnly = true;
                if (filterOffersOnly) filterOffersOnly.checked = true;
                applyLocalSortingAndRender();
                showToast('Mostrando Ofertas Relámpago con descuento', 'warning');
            } else if (filter === 'mas-vendidos') {
                state.sortBy = 'rating-desc';
                if (selectSort) selectSort.value = 'rating-desc';
                applyLocalSortingAndRender();
            } else if (filter === 'garaje') {
                document.getElementById('garaje')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                state.searchQuery = filter;
                fetchProducts();
            }
        });
    });

    // Ordenamiento
    if (selectSort) {
        selectSort.addEventListener('change', () => {
            state.sortBy = selectSort.value;
            applyLocalSortingAndRender();
        });
    }

    if (filterOffersOnly) {
        filterOffersOnly.addEventListener('change', () => {
            state.offersOnly = filterOffersOnly.checked;
            applyLocalSortingAndRender();
        });
    }

    if (btnApplyPrice) {
        btnApplyPrice.addEventListener('click', () => {
            state.minPrice = filterMinPrice ? filterMinPrice.value : '';
            state.maxPrice = filterMaxPrice ? filterMaxPrice.value : '';
            fetchProducts();
        });
    }

    // Contador Oferta Relámpago
    function startFlashDealCountdown() {
        const timerEl = document.getElementById('flash-deal-timer');
        if (!timerEl) return;

        let totalSeconds = 4 * 3600 + 32 * 60 + 15;
        setInterval(() => {
            if (totalSeconds > 0) totalSeconds--;
            const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const secs = String(totalSeconds % 60).padStart(2, '0');
            timerEl.textContent = `⏱️ Termina en ${hrs}:${mins}:${secs}`;
        }, 1000);
    }

    function setupEventListeners() {
        const btnHeroExplore = document.getElementById('btn-hero-explore');
        if (btnHeroExplore) {
            btnHeroExplore.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
            });
        }

        const btnHeroGarage = document.getElementById('btn-hero-garage');
        if (btnHeroGarage) {
            btnHeroGarage.addEventListener('click', () => {
                document.getElementById('garaje')?.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Mini tiles en hero
        document.querySelectorAll('.mini-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const cat = tile.dataset.cat;
                const search = tile.dataset.search;
                if (cat) {
                    state.selectedCategory = cat;
                    fetchProducts();
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                } else if (search) {
                    state.searchQuery = search;
                    if (mainSearchInput) mainSearchInput.value = search;
                    fetchProducts();
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
});

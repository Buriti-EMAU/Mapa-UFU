import { MAPBOX_ACCESS_TOKEN } from './config.js'; 
import { addRectangleToMap } from './bloco1i.js';

if (typeof MAPBOX_ACCESS_TOKEN === 'undefined') {
    throw new Error("O Token de Acesso do Mapbox não está definido. Por favor, certifique-se de que o arquivo js/config.js foi criado, contém seu token e está incluído no seu HTML antes de main.js.");
}

// Define os limites de Uberlândia para restringir a visualização do mapa
const UBERLANDIA_BOUNDS = [
    [-48.30, -19.00], // Coordenadas Sudoeste [lng, lat]
    [-48.10, -18.80]  // Coordenadas Nordeste [lng, lat]
];

// Detecção simples de dispositivo móvel baseada apenas na largura da tela
function checkIsMobile() {
    return window.innerWidth <= 768;
}

const isMobile = checkIsMobile();

// Atualiza a detecção de dispositivo móvel ao redimensionar a janela
window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    const newIsMobile = checkIsMobile();
    
    if (wasMobile !== newIsMobile) {
        location.reload(); // Recarrega a página ao alternar entre visualização móvel e desktop
    }
});

// Inicialização do mapa com configurações específicas para dispositivos móveis
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    // Usa um estilo que inclui dados de edifícios 3D
    style: 'mapbox://styles/emauburiti/cmb8mw0oh015401qy4kri8jnm',
    center: [-48.258, -18.919], // Centraliza no campus UFU Santa Mônica
    zoom: isMobile ? 14.5 : 15, // Zoom ligeiramente menor em dispositivos móveis
    pitch: isMobile ? 0 : 45, // Começa com visualização 2D em dispositivos móveis
    bearing: isMobile ? 0 : -17.6, // Sem rotação inicial em dispositivos móveis
    antialias: true, // Habilita antialiasing para linhas mais suaves
    maxBounds: UBERLANDIA_BOUNDS, // Limita a visualização do mapa a Uberlândia
    minZoom: 14, // Nível mínimo de zoom
    maxZoom: 20, // Nível máximo de zoom
    attributionControl: false, // Adicionaremos isso manualmente em uma posição melhor para dispositivos móveis
    renderWorldCopies: false, // Impede a renderização de múltiplas cópias do mundo
    localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif", // Melhor tratamento de fontes
    fadeDuration: 100, // Transição mais rápida para melhor desempenho em dispositivos móveis
    trackResize: true // Garante que o mapa redimensione corretamente em dispositivos móveis
});

// Cores das categorias
const categoryColors = {
    'Laboratórios e Núcleos': '#283aa0', // Renamed from 'Laboratório'
    'Alimentação': '#832b23',
    'Administrativo': '#187230',
    'Lazer': '#FB29CC',
    'Bloco': '#000000',         // New color for "Bloco"
    'Transporte': '#009688',      // New category
    'Gráfica e papelaria': '#FFB300', // New category
    'Entrada': '#757575',         // New category - color might be unused if marker is custom
    'Museu': '#673AB7',
    'Bares e Adegas': '#FB9090',
    'Academia': '#80FF10',          
};

// Armazena todos os marcadores
let markers = [];
let places = [];
// Update activeFilters to include categories from your places.json by default
// Reordered as requested
let activeFilters = [
    'Entrada',
    'Transporte',
    'Bloco',
    'Laboratórios e Núcleos',
    'Administrativo',
    'Lazer',
    'Alimentação',
    'Gráfica e papelaria',
    'Museu',
    'Bares e Adegas',
    'Academia',
];
let currentPlaceId;

const ISOCHRONE_SOURCE_ID = 'isochrone-source';
const ISOCHRONE_LAYER_ID = 'isochrone-layer';

// Carrega os dados dos locais
async function loadPlacesData() {
    try {
        const response = await fetch('data/places.json');
        console.log('Carregando dados dos locais:', response.status, response.statusText);
        places = await response.json();
        console.log('Dados dos locais carregados:', places);
        addMarkersToMap();
    } catch (error) {
        console.error('Erro ao carregar dados dos locais:', error);
        // Para desenvolvimento, usa dados de exemplo
        loadSampleData();
    }
}

// Carrega dados de exemplo para desenvolvimento
// This function is currently empty. If loadPlacesData fails, no markers will show.
async function loadSampleData() {
    console.warn("loadSampleData was called, but it's currently empty. No fallback data loaded.");
}

// Adiciona marcadores ao mapa
function addMarkersToMap() {
    // Limpa os marcadores existentes
    markers.forEach(marker => marker.remove());
    markers = [];
       
    // Adiciona CSS específico para posicionamento de marcadores em dispositivos móveis, se necessário
    if (isMobile && !document.getElementById('mobile-marker-fix')) {
        const style = document.createElement('style');
        style.id = 'mobile-marker-fix';
        style.textContent = `
            .mapboxgl-marker {
                cursor: pointer;
            }
            .mapboxgl-marker div {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // Adiciona novos marcadores
    console.log('Adding markers:', places);
    places.forEach(place => {
        if (activeFilters.includes(place.category)) {
            // Cria um elemento div simples para o marcador
            const el = document.createElement('div');
            el.className = 'marker';

            // Default circular marker styling for all categories

            if (true) { // This 'if(true)' is just to maintain the else structure, can be removed if Lazer is also default
                el.style.backgroundColor = categoryColors[place.category] || '#CCCCCC'; // Default to gray
                el.style.width = isMobile ? '20px' : '16px'; // Decreased size
                el.style.height = isMobile ? '20px' : '16px'; // Decreased size
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
            }
            // Cria um marcador padrão com âncora no centro
            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'center'
            })
            .setLngLat([place.longitude, place.latitude])
            .addTo(map);
            console.log(`[Marker] Added marker for place: ${place.name} at [${place.longitude}, ${place.latitude}]`);
            
            // Create a popup, but don't add it to the map yet.
            // This popup will be used for hover effects.
            const hoverPopup = new mapboxgl.Popup({
                closeButton: false, // No close button for hover popups
                closeOnClick: false, // Don't close when the map is clicked
                offset: isMobile ? [0, -25] : [0, -15] // Position above the marker [offsetX, offsetY]
            });

            marker.getElement().addEventListener('mouseenter', () => {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';

                // Populate the popup and set its coordinates based on the marker's location.
                hoverPopup.setLngLat(marker.getLngLat())
                    .setHTML(`<strong>${place.name}</strong>`)
                    .addTo(map);
            });

            marker.getElement().addEventListener('mouseleave', () => {
                map.getCanvas().style.cursor = ''; // Reset cursor
                hoverPopup.remove();
            });
            
            // Adiciona evento de clique
            marker.getElement().addEventListener('click', () => {
                // Mostra os detalhes do local imediatamente
                showPlaceDetails(place);
                
                // Adiciona feedback tátil em dispositivos móveis, se disponível
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
            
            markers.push(marker);
        }
    });
}

// Função auxiliar para encontrar o ID da primeira camada de símbolo para o posicionamento adequado da isócrona
function getFirstSymbolLayerId() {
    if (!map || !map.isStyleLoaded()) return undefined;
    const layers = map.getStyle().layers;
    for (const layer of layers) {
        if (layer.type === 'symbol') {
            return layer.id;
        }
    }
    return undefined; // Se nenhuma camada de símbolo for encontrada, a nova camada será adicionada no topo.
}

// Função para remover a camada e a fonte da isócrona existentes
function removeIsochrone() {
    if (map && map.isStyleLoaded()) { // Verifica se o mapa está pronto
        if (map.getLayer(ISOCHRONE_LAYER_ID)) {
            map.removeLayer(ISOCHRONE_LAYER_ID);
        }
        if (map.getSource(ISOCHRONE_SOURCE_ID)) {
            map.removeSource(ISOCHRONE_SOURCE_ID);
        }
    }
}

// Busca e exibe a isócrona para uma determinada localização
async function fetchAndDisplayIsochrone(longitude, latitude) {
    console.log(`[Isochrone] Attempting to fetch for Lng: ${longitude}, Lat: ${latitude}`);
    removeIsochrone(); // Limpa qualquer isócrona existente

    const walkingTime = 14; // 14 minutos de distância a pé
    const profile = 'mapbox/walking'; // Perfil para caminhada
    // Ensure MAPBOX_ACCESS_TOKEN is used here, not an undefined mapboxToken
    if (typeof MAPBOX_ACCESS_TOKEN === 'undefined') {
        console.error("[Isochrone] MAPBOX_ACCESS_TOKEN is not defined!");
        return;
    }
    const apiUrl = `https://api.mapbox.com/isochrone/v1/${profile}/${longitude},${latitude}?contours_minutes=${walkingTime}&polygons=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
    console.log("[Isochrone] API URL:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        console.log("[Isochrone] API response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text(); // Obtém o texto do erro bruto primeiro
            console.error(`[Isochrone] Error fetching: ${response.status} ${response.statusText}. Response body:`, errorText);
            try {
                const errorData = JSON.parse(errorText); // Tenta analisar como JSON
                console.error("[Isochrone] Parsed error data:", errorData);
            } catch (e) {
                // Se não for JSON, o texto bruto já foi registrado.
            }
            return;
        }

        const isochroneData = await response.json();
        console.log("[Isochrone] Received data:", isochroneData);

        if (!isochroneData || !isochroneData.features || isochroneData.features.length === 0) {
            console.warn('[Isochrone] Data received is empty or has no features. Features:', isochroneData ? isochroneData.features : 'undefined');
            return;
        }

        if (map.isStyleLoaded()) {
            console.log("[Isochrone] Map style is loaded. Adding source and layer.");
            // Verificações defensivas, embora removeIsochrone deva lidar com isso
            if (map.getSource(ISOCHRONE_SOURCE_ID)) {
                console.warn("[Isochrone] Source still exists. Removing before adding new one.");
                map.removeSource(ISOCHRONE_SOURCE_ID);
            }
            if (map.getLayer(ISOCHRONE_LAYER_ID)) {
                console.warn("[Isochrone] Layer still exists. Removing before adding new one.");
                map.removeLayer(ISOCHRONE_LAYER_ID);
            }

            map.addSource(ISOCHRONE_SOURCE_ID, {
                type: 'geojson',
                data: isochroneData
            });
            console.log("[Isochrone] Source added:", ISOCHRONE_SOURCE_ID);

            map.addLayer({
                id: ISOCHRONE_LAYER_ID,
                type: 'fill', // Tipo correto para polígonos preenchidos no Mapbox GL JS
                source: ISOCHRONE_SOURCE_ID,
                paint: {
                    'fill-color': '#5500cf', //Roxo
                    'fill-opacity': 0.4
                },
            }, getFirstSymbolLayerId());
            console.log("[Isochrone] Layer added:", ISOCHRONE_LAYER_ID);
        } else {
            console.warn("[Isochrone] Map style not fully loaded when trying to add. This is unexpected if called after map 'load' event.");
        }
    } catch (error) {
        console.error('[Isochrone] Error in fetchAndDisplayIsochrone function:', error);
    }
}

// Mostra os detalhes do local no painel lateral
function showPlaceDetails(place) {
    const detailsPanel = document.querySelector('.place-details');
    detailsPanel.classList.add('active');
    
    // Armazena o ID do local atual para navegação por miniaturas
    currentPlaceId = place.id;
    
    // Atualiza as informações do local
    document.getElementById('place-name').textContent = place.name;
    document.getElementById('place-category').textContent = place.category;
    // Handle cases where evaluation might be empty or not a number
    const evaluation = parseFloat(place.evaluation);
    if (!isNaN(evaluation)) {
        document.getElementById('place-rating').textContent = evaluation.toFixed(1);
    } else {
        document.getElementById('place-rating').textContent = "";
    }
    document.getElementById('place-description').innerHTML = place.description;
    
    // Gera estrelas para a avaliação
    const starsContainer = document.querySelector('.stars');
    starsContainer.innerHTML = '';
    
    const fullStars = Math.floor(place.evaluation);
    const hasHalfStar = place.evaluation % 1 >= 0.5;

    if (!isNaN(evaluation)) {
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            
            if (i < fullStars) {
                star.innerHTML = '★';
            } else if (i === fullStars && hasHalfStar) {
                star.innerHTML = '★'; // Or use a specific half-star icon/character
                star.style.opacity = '0.5';
            } else {
                star.innerHTML = '☆';
            }
            starsContainer.appendChild(star);
        }
    } else {
        starsContainer.innerHTML = '<span>---</span>';
    }
    
    // Atualiza as imagens
    const mainImage = document.getElementById('main-image');
    const thumb1 = document.getElementById('thumb-1');
    const thumb2 = document.getElementById('thumb-2');
    const thumb3 = document.getElementById('thumb-3');
    
    // Pré-carrega as imagens para evitar cintilação
    const preloadImages = () => {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const imagesToLoad = place.images || []; // Handle if place.images is undefined
            const totalImages = imagesToLoad.length;

            if (totalImages === 0) {
                resolve(); // Resolve immediately if no images
                return;
            }
            
            imagesToLoad.forEach((src, index) => {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        resolve();
                    }
                };
                // Prepend 'data/places/images/' or similar if image paths in JSON are relative to a subfolder
                // Assuming images in places.json are at root for now, or you adjust paths here/in JSON
                // For example, if images are in 'img/' folder: img.src = `img/${src}`;
                img.src = `data/places/${src}`; // Assuming images are in an 'img' folder at the root
            });
            
            // Fallback caso as imagens não carreguem
            setTimeout(resolve, 1000);
        });
    };
    
    // Define as imagens após o pré-carregamento
    preloadImages().then(() => {
        const images = place.images || [];
        const imagePathPrefix = 'data/places/'; // Define this based on where your images are stored relative to index.html

        mainImage.src = images.length > 0 ? `${imagePathPrefix}${images[0]}` : '';
        mainImage.style.display = images.length > 0 ? 'block' : 'none';

        const thumbElements = [thumb1, thumb2, thumb3];
        thumbElements.forEach((thumbEl, index) => {
            if (images.length > index) {
                thumbEl.src = `${imagePathPrefix}${images[index]}`;
                thumbEl.style.display = 'block';
            } else {
                thumbEl.src = '';
                thumbEl.style.display = 'none';
            }
        });
        
        // Define a primeira miniatura como ativa
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(t => t.classList.remove('active'));
        if (images.length > 0 && thumb1.style.display !== 'none') {
            thumb1.classList.add('active');
        }
    });
    
    // Busca e exibe a isócrona de 10 minutos a pé
    fetchAndDisplayIsochrone(place.longitude, place.latitude);

    // Em dispositivos móveis, voa para a localização ao mostrar detalhes
    if (isMobile) {
        map.flyTo({
            center: [place.longitude, place.latitude],
            zoom: 17,
            duration: 1000
        });
    }
}

// Fecha o painel de detalhes
document.querySelector('.close-details').addEventListener('click', () => {
    document.querySelector('.place-details').classList.remove('active');
    removeIsochrone(); // Remove a isócrona quando o painel é fechado
});

// Lida com cliques nas miniaturas
document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
        const index = parseInt(thumb.getAttribute('data-index'), 10); // Ensure index is a number
        const place = places.find(p => p.id === currentPlaceId);
        const images = place ? (place.images || []) : [];
        const imagePathPrefix = 'data/places/'; // Consistent with showPlaceDetails
        
        if (place && index >= 0 && images.length > index) {
            document.getElementById('main-image').src = `${imagePathPrefix}${images[index]}`;
            
            // Atualiza a miniatura ativa
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        } else {
            console.warn(`Thumbnail click: Image at index ${index} not found for place id ${currentPlaceId}`);
        }
    });
});

// Lida com os filtros de categoria
document.querySelectorAll('.category-filter').forEach(filter => {
    filter.addEventListener('change', () => {
        const category = filter.value;
        
        if (filter.checked) {
            if (!activeFilters.includes(category)) {
                activeFilters.push(category);
            }
        } else {
            activeFilters = activeFilters.filter(cat => cat !== category);
        }
        
        addMarkersToMap();
    });
});

// Function to update all filter checkboxes based on activeFilters array
function updateFilterCheckboxes() {
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.checked = activeFilters.includes(checkbox.value);
    });
}

// Function to handle "Select/Deselect All"
function setupSelectAllFilters() {
    const selectAllBtn = document.getElementById('select-all-filters-btn');
    if (!selectAllBtn) return;

    selectAllBtn.addEventListener('click', () => {
        const allCategories = Object.keys(categoryColors); // Or a predefined list of all possible categories
        // If all are currently selected (or more than half), deselect all. Otherwise, select all.
        if (activeFilters.length === allCategories.length) {
            activeFilters = [];
            selectAllBtn.textContent = 'Selecionar Todos';
        } else {
            activeFilters = [...allCategories];
            selectAllBtn.textContent = 'Desmarcar Todos';
        }
        updateFilterCheckboxes();
        addMarkersToMap();
    });

    // Set initial button text
    const allCategories = Object.keys(categoryColors);
    if (activeFilters.length === allCategories.length) {
        selectAllBtn.textContent = 'Desmarcar Todos';
    } else {
        selectAllBtn.textContent = 'Selecionar Todos';
    }
}
// Estas funções não são mais usadas, pois estamos adicionando edifícios 3D diretamente na função map.on('load')
// Mantendo este comentário como referência

// Lida com o modal de boas-vindas
function setupWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const startBtn = document.getElementById('start-exploring');
    
    // Mostra o modal ao carregar a página
    modal.classList.add('active');
    
    // Fecha o modal quando o botão de fechar é clicado
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Fecha o modal quando o botão "Começar a Explorar" é clicado
    startBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Fecha o modal ao clicar fora dele
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Armazena o estado do modal no localStorage para não mostrá-lo novamente na mesma sessão
    if (localStorage.getItem('welcomeModalShown')) {
        modal.classList.remove('active');
    } else {
        localStorage.setItem('welcomeModalShown', 'true');
    }
}

// Inicializa o mapa quando carregado
map.on('load', () => {
    console.log('Map loaded');
    loadPlacesData();
    
    // Adiciona edifícios 3D diretamente aqui em vez de em uma função separada
    console.log('Adding 3D buildings directly');
       
    // Edifícios personalizados da UFU foram removidos conforme solicitado
    
    // Adiciona edifícios do OSM com visibilidade aprimorada
    try {
        map.addLayer({
            'id': 'osm-3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 14,
            'paint': {
                // Usa uma expressão de cor para tornar os edifícios mais visíveis
                'fill-extrusion-color': [
                    'match',
                    ['get', 'type'],
                    'education', '#4285F4', // Blue for educational buildings
                    'commercial', '#EA4335', // Red for commercial buildings
                    'residential', '#FBBC05', // Yellow for residential buildings
                    'government', '#34A853', // Green for government buildings
                    '#a13025'
                ],
                'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0,
                    16, ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0,
                    16, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.9
            }
        });
        console.log('Successfully added OSM buildings layer with enhanced visibility');
        
        // Em dispositivos móveis, começa com os edifícios 3D ocultos
        if (isMobile) {
            map.setLayoutProperty('osm-3d-buildings', 'visibility', 'none');
        }
    } catch (e) {
        console.error('Error adding OSM buildings:', e);
    }
    
    setupWelcomeModal();
    
    // Adiciona controles de navegação - posiciona de forma diferente em dispositivos móveis
    map.addControl(new mapboxgl.NavigationControl(), isMobile ? 'bottom-right' : 'top-right');
    
    // Adiciona controle de tela cheia - posiciona de forma diferente em dispositivos móveis
    map.addControl(new mapboxgl.FullscreenControl(), isMobile ? 'bottom-right' : 'top-right');
    
    // Adiciona controle de atribuição em uma posição melhor para dispositivos móveis
    map.addControl(new mapboxgl.AttributionControl({
        compact: isMobile
    }), 'bottom-left');
    
    // Configura interações específicas para dispositivos móveis
    setupMobileInteractions();
    setupSelectAllFilters(); // Initialize the select/deselect all button

    // Adiciona o recurso de retângulo (se necessário)
    addRectangleToMap(map);
});



// Configura interações específicas para dispositivos móveis
function setupMobileInteractions() {
    // Lida com o botão de alternância de filtro para dispositivos móveis
    const filterToggleBtn = document.getElementById('filter-toggle');
    const mapFilters = document.getElementById('map-filters');
    
    if (filterToggleBtn && mapFilters) {
        filterToggleBtn.addEventListener('click', () => {
            mapFilters.classList.toggle('active');
        });
        
        // Fecha os filtros quando um filtro é selecionado
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('change', () => {
                // Em dispositivos móveis, fecha o painel de filtro após a seleção
                if (isMobile) {
                    setTimeout(() => {
                        mapFilters.classList.remove('active');
                    }, 300);
                }
            });
        });
        
        // Fecha os filtros ao clicar fora
        map.getCanvas().addEventListener('click', () => {
            if (mapFilters.classList.contains('active')) {
                mapFilters.classList.remove('active');
            }
        });
    }
    
    // Ajusta o tamanho do marcador para dispositivos móveis
    function updateMarkerSize() {
        const markerElements = document.querySelectorAll('.marker');
        const size = isMobile ? '20px' : '16px'; // Adjusted to be consistent with initial creation
        
        markerElements.forEach(marker => {
            marker.style.width = size;
            marker.style.height = size;
        });
    }
    
    // Atualiza o tamanho do marcador quando a janela é redimensionada
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newIsMobile = checkIsMobile();
            if (newIsMobile !== isMobile) {
                location.reload(); // Recarrega a página se o estado móvel mudar
            } else {
                // Apenas atualiza os elementos da UI sem recarregar completamente
                updateMarkerSize();
                adjustUIForScreenSize();
            }
        }, 250); // Debounce para eventos de redimensionamento
    });
    
    // Função para ajustar elementos da UI com base no tamanho da tela
    function adjustUIForScreenSize() {
        const width = window.innerWidth;
        const mapFilters = document.getElementById('map-filters');
        const detailsPanel = document.querySelector('.place-details');
        const toggleButton = document.querySelector('.toggle-3d-btn');
        
        // Ajusta o painel de filtro
        if (width <= 480) {
            mapFilters.classList.remove('active');
            if (toggleButton) {
                // is3DView is not defined in this scope. Use a global or passed state.
                // Assuming is3DViewGlobal is defined at a higher scope
                toggleButton.innerHTML = is3DViewGlobal ? '2D' : '3D';
            }
        } else if (width > 768) {
            mapFilters.classList.remove('active');
            if (toggleButton) {
                toggleButton.innerHTML = is3DViewGlobal ? 'Voltar para 2D' : 'Voltar para 3D';
            }
        }
        
        // Ajusta o painel de detalhes
        if (detailsPanel.classList.contains('active')) {
            if (width <= 768) {
                detailsPanel.style.width = '100%';
            } else {
                detailsPanel.style.width = '400px';
            }
        }
    }
    
    // Lida com eventos de toque para o painel de detalhes do local
    const detailsPanel = document.querySelector('.place-details');
    if (detailsPanel && isMobile) {
        let startY = 0;
        let currentHeight = 0;
        let isDragging = false;
        const detailsHeader = detailsPanel.querySelector('.place-info');
        
        // Adiciona indicador visual para a área arrastável
        if (detailsHeader) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.style.width = '40px';
            dragHandle.style.height = '5px';
            dragHandle.style.backgroundColor = '#ccc';
            dragHandle.style.borderRadius = '3px';
            dragHandle.style.margin = '0 auto 15px auto';
            detailsHeader.insertBefore(dragHandle, detailsHeader.firstChild);
        }
        
        // Eventos de toque para todo o painel
        detailsPanel.addEventListener('touchstart', (e) => {
            if (!detailsPanel.classList.contains('active')) return;
            startY = e.touches[0].clientY;
            currentHeight = detailsPanel.offsetHeight;
            
            // Só começa a arrastar se o toque estiver próximo ao topo do painel
            if (startY < detailsPanel.getBoundingClientRect().top + 100) {
                isDragging = true;
            }
        });
        
        detailsPanel.addEventListener('touchmove', (e) => {
            if (!detailsPanel.classList.contains('active') || !isDragging) return;
            
            // Impede a rolagem durante o arrasto
            e.preventDefault();
            
            const deltaY = e.touches[0].clientY - startY;
            const newHeight = Math.max(100, currentHeight - deltaY);
            
            // Limita a altura máxima a 90% da viewport
            const maxHeight = window.innerHeight * 0.9;
            detailsPanel.style.height = `${Math.min(newHeight, maxHeight)}px`;
        });
        
        detailsPanel.addEventListener('touchend', () => {
            if (!detailsPanel.classList.contains('active') || !isDragging) return;
            
            isDragging = false;
            
            // Fecha se arrastado abaixo do limite
            if (parseInt(detailsPanel.style.height) < window.innerHeight * 0.3) {
                detailsPanel.classList.remove('active');
                detailsPanel.style.height = '';
            } else if (parseInt(detailsPanel.style.height) > window.innerHeight * 0.7) {
                // Expand to full height if dragged up significantly
                detailsPanel.style.height = '80vh';
            } else {
                // Redefine para a altura padrão
                detailsPanel.style.height = '70vh';
            }
        });
        
        // Toque duplo para maximizar/minimizar
        let lastTap = 0;
        detailsPanel.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                // Toque duplo detectado
                if (detailsPanel.style.height === '80vh') {
                    detailsPanel.style.height = '50vh';
                } else {
                    detailsPanel.style.height = '80vh';
                }
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    }
}

// Adiciona um botão para alternar edifícios 3D
document.addEventListener('DOMContentLoaded', () => {
    // Cria um botão para alternar a visualização 3D
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-3d-btn';
    toggleButton.innerHTML = isMobile ? '3D' : 'Voltar para 3D';
    
    // Adiciona o botão ao contêiner do mapa
    document.querySelector('.map-container').appendChild(toggleButton);
    
    // Use a globally accessible variable for 3D state, e.g., is3DViewGlobal
    // let is3DView = !isMobile; // This creates a local variable, not accessible elsewhere
    
    // Adiciona ícone 3D para dispositivos móveis
    if (isMobile) {
        const style = document.createElement('style');
        style.textContent = `
            .toggle-3d-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-weight: bold;
                background-color: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .toggle-3d-btn:active {
                transform: scale(0.95);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleButton.addEventListener('click', () => {
        is3DViewGlobal = !is3DViewGlobal; // Toggle the global state
        
        if (is3DViewGlobal) {
            // Alterna para visualização 3D - usa configurações diferentes para dispositivos móveis
            map.easeTo({
                pitch: isMobile ? 35 : 45, // Ângulo menos íngreme em dispositivos móveis
                bearing: isMobile ? -10 : -17.6, // Menos rotação em dispositivos móveis
                duration: 1000,
                zoom: map.getZoom() - (isMobile ? 0.2 : 0) // Leve zoom out em dispositivos móveis para melhor contexto
            });
            
            // Mostra as camadas de edifícios 3D do OSM
            try {
                if (map.getLayer('osm-3d-buildings')) {
                    map.setLayoutProperty('osm-3d-buildings', 'visibility', 'visible');
                    
                    // Reduz a opacidade em dispositivos móveis para melhor desempenho
                    if (isMobile) {
                        map.setPaintProperty('osm-3d-buildings', 'fill-extrusion-opacity', 0.6);
                    }
                }
            } catch (e) {
                console.log('Não foi possível definir a visibilidade dos edifícios 3D: ', e);
            }
            
            toggleButton.innerHTML = isMobile ? '2D' : 'Voltar para 2D';
            
            // Adiciona feedback tátil em dispositivos móveis suportados
            if (isMobile && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        } else {
            // Switch to 2D view
            map.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1000
            });
            
            // Oculta as camadas de edifícios 3D do OSM
            try {
                if (map.getLayer('osm-3d-buildings')) {
                    map.setLayoutProperty('osm-3d-buildings', 'visibility', 'none');
                }
            } catch (e) {
                console.log('Não foi possível definir a visibilidade dos edifícios 3D: ', e);
            }
            
            toggleButton.innerHTML = isMobile ? '3D' : 'Voltar para 3D';
            
            // Adiciona feedback tátil em dispositivos móveis suportados
            if (isMobile && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }
    });
});

// Declare is3DViewGlobal at a higher scope if it's to be used by adjustUIForScreenSize
// and the 3D toggle button logic.
let is3DViewGlobal = !isMobile; // Initial state
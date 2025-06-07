import { MAPBOX_ACCESS_TOKEN } from './config.js'; 

if (typeof MAPBOX_ACCESS_TOKEN === 'undefined') {
    throw new Error("O Token de Acesso do Mapbox não está definido. Por favor, certifique-se de que o arquivo js/config.js foi criado, contém seu token e está incluído no seu HTML antes de main.js.");
}

// Define os limites de Uberlândia para restringir a visualização do mapa
const UBERLANDIA_BOUNDS = [
    [-48.35, -19.05], // Coordenadas Sudoeste [lng, lat]
    [-48.15, -18.85]  // Coordenadas Nordeste [lng, lat]
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
    minZoom: 13, // Nível mínimo de zoom
    maxZoom: 20, // Nível máximo de zoom
    attributionControl: false, // Adicionaremos isso manualmente em uma posição melhor para dispositivos móveis
    renderWorldCopies: false, // Impede a renderização de múltiplas cópias do mundo
    localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif", // Melhor tratamento de fontes
    fadeDuration: 100, // Transição mais rápida para melhor desempenho em dispositivos móveis
    trackResize: true // Garante que o mapa redimensione corretamente em dispositivos móveis
});

// Cores das categorias
const categoryColors = {
    'Acadêmico': '#4285F4',
    'Alimentação': '#EA4335',
    'Administrativo': '#34A853',
    'Lazer': '#FBBC05',
    'Serviços': '#9C27B0'
};

// Armazena todos os marcadores
let markers = [];
let places = [];
let activeFilters = ['Acadêmico', 'Alimentação', 'Administrativo', 'Lazer', 'Serviços'];
let currentPlaceId;

const ISOCHRONE_SOURCE_ID = 'isochrone-source';
const ISOCHRONE_LAYER_ID = 'isochrone-layer';

// Carrega os dados dos locais
async function loadPlacesData() {
    try {
        const response = await fetch('data/places.json');
        places = await response.json();
        addMarkersToMap();
    } catch (error) {
        console.error('Erro ao carregar dados dos locais:', error);
        // Para desenvolvimento, usa dados de exemplo
        loadSampleData();
    }
}

// Carrega dados de exemplo para desenvolvimento
async function loadSampleData() {
    places = [
        {
            id: 'biblioteca',
            name: 'Biblioteca Central',
            latitude: -18.918854,
            longitude: -48.257977,
            category: 'Acadêmico',
            description: 'A Biblioteca Central Santa Mônica oferece um amplo acervo de livros, periódicos e recursos digitais para a comunidade acadêmica. Possui espaços para estudo individual e em grupo.',
            evaluation: 4.5,
            images: [
                'data/places/biblioteca/Image_01.jpg',
                'data/places/biblioteca/Image_02.jpg',
                'data/places/biblioteca/Image_03.jpg'
            ]
        },
        {
            id: 'restaurante_universitario',
            name: 'Restaurante Universitário',
            latitude: -18.919523,
            longitude: -48.259822,
            category: 'Alimentação',
            description: 'O Restaurante Universitário (RU) oferece refeições a preços acessíveis para estudantes e servidores. Serve café da manhã, almoço e jantar em dias úteis.',
            evaluation: 4.2,
            images: [
                'data/places/restaurante_universitario/Image_01.jpg',
                'data/places/restaurante_universitario/Image_02.jpg',
                'data/places/restaurante_universitario/Image_03.jpg'
            ]
        },
        {
            id: 'bloco_1a',
            name: 'Bloco 1A',
            latitude: -18.917654,
            longitude: -48.258123,
            category: 'Acadêmico',
            description: 'O Bloco 1A abriga salas de aula, laboratórios e gabinetes de professores da Faculdade de Engenharia Elétrica. Possui estrutura moderna para atividades de ensino e pesquisa.',
            evaluation: 4.0,
            images: [
                'data/places/bloco_1a/Image_01.jpg',
                'data/places/bloco_1a/Image_02.jpg',
                'data/places/bloco_1a/Image_03.jpg'
            ]
        }
    ];
    addMarkersToMap();
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
    places.forEach(place => {
        if (activeFilters.includes(place.category)) {
            // Cria um elemento div simples para o marcador
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundColor = categoryColors[place.category];
            el.style.width = isMobile ? '30px' : '20px';
            el.style.height = isMobile ? '30px' : '20px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
            
            // Cria um marcador padrão com âncora no centro
            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'center'
            })
            .setLngLat([place.longitude, place.latitude])
            .addTo(map);
            
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
    const apiUrl = `https://api.mapbox.com/isochrone/v1/${profile}/${longitude},${latitude}?contours_minutes=${walkingTime}&polygons=true&access_token=${mapboxToken}`;
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
                    'fill-color': '#5a9fcf', // Um azul agradável para o polígono da isócrona
                    'fill-opacity': 0.3
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
    document.getElementById('place-rating').textContent = place.evaluation.toFixed(1);
    document.getElementById('place-description').textContent = place.description;
    
    // Gera estrelas para a avaliação
    const starsContainer = document.querySelector('.stars');
    starsContainer.innerHTML = '';
    
    const fullStars = Math.floor(place.evaluation);
    const hasHalfStar = place.evaluation % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        
        if (i < fullStars) {
            star.innerHTML = '★';
        } else if (i === fullStars && hasHalfStar) {
            star.innerHTML = '★';
            star.style.opacity = '0.5';
        } else {
            star.innerHTML = '☆';
        }
        
        starsContainer.appendChild(star);
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
            const totalImages = place.images.length;
            
            place.images.forEach((src, index) => {
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
                img.src = src;
            });
            
            // Fallback caso as imagens não carreguem
            setTimeout(resolve, 1000);
        });
    };
    
    // Define as imagens após o pré-carregamento
    preloadImages().then(() => {
        mainImage.src = place.images[0];
        thumb1.src = place.images[0];
        thumb2.src = place.images[1];
        thumb3.src = place.images[2];
        
        // Define a primeira miniatura como ativa
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (index === 0) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
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
        const index = thumb.getAttribute('data-index');
        const place = places.find(p => p.id === currentPlaceId);
        
        if (place) {
            document.getElementById('main-image').src = place.images[index];
            
            // Atualiza a miniatura ativa
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
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
                    '#a13025' // Roxo para outros edifícios
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
                'fill-extrusion-opacity': 0.8
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
});

// currentPlaceId já foi declarado acima

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
        const size = isMobile ? '24px' : '20px';
        
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
                toggleButton.innerHTML = is3DView ? '2D' : '3D';
            }
        } else if (width > 768) {
            mapFilters.classList.remove('active');
            if (toggleButton) {
                toggleButton.innerHTML = is3DView ? 'Voltar para 2D' : 'Voltar para 3D';
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
    
    // Alterna a visualização 3D quando o botão é clicado
    let is3DView = !isMobile; // Começa com 3D desligado em dispositivos móveis
    
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
        is3DView = !is3DView;
        
        if (is3DView) {
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
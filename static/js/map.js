// static/js/map.js

/**
 * Normaliza o texto removendo acentos, cedilhas e convertendo para minúsculas.
 * Ex: 'São Paulo' -> 'sao paulo'
 */
function normalizeText(text) {
    if (!text) return '';
    // Converte para String, remove acentos (NFD) e caracteres não ASCII (regex)
    return String(text)
        .normalize('NFD') // Normaliza para decompor caracteres (e.g., á em a + ´)
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos decompostos (os caracteres diacríticos)
        .toLowerCase()
        .trim();
}

console.log("🗺️ Iniciando Mapa de Clientes com Leaflet e Alpine.js...");

// Inicialização do mapa (Lógica pura Leaflet)
const map = L.map('map', { 
    tap: true,
    // DESATIVA o controle de zoom PADRÃO (left)
    zoomControl: false 
}).setView([-15.7801, -47.9292], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// ADICIONA o controle de zoom no canto superior direito
L.control.zoom({ position: 'topright' }).addTo(map); 

// Cluster de marcadores
const markersCluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50
});
map.addLayer(markersCluster);

// -------------------------------------------------------------
// Funções do Leaflet (Separadas da lógica do Alpine.js)
// -------------------------------------------------------------

// VARIÁVEIS PARA A LOCALIZAÇÃO DO USUÁRIO
let userLocationMarker = null;
let userLocationCircle = null;

/**
 * Inicia o processo de obtenção da localização do usuário via Geolocation API.
 */
function locateUser() {
    console.log("Procurando sua localização...");
    
    // Tenta obter a localização, centraliza o mapa e define um zoom padrão (14)
    map.locate({
        setView: true, 
        maxZoom: 14,   
        enableHighAccuracy: true 
    });
}

// Evento disparado quando a localização é encontrada
map.on('locationfound', function(e) {
    const latlng = e.latlng;
    const radius = e.accuracy; // Precisão em metros
    
    // 1. Remove o marcador e o círculo antigos, se existirem
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        map.removeLayer(userLocationCircle);
    }
    
    // 2. Adiciona NOVO marcador de localização (ícone azul personalizado)
    userLocationMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'user-location-icon',
            // Ponto central azul com borda
            html: '<div style="background-color: #0078FF; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 3px #0078FF66;"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        })
    }).addTo(map)
      .bindPopup(`Você está aqui!`)
      .openPopup();
    
    // 3. Adiciona um círculo para mostrar a área de precisão
    userLocationCircle = L.circle(latlng, radius, {
        color: '#0078FF',
        fillColor: '#0078FF',
        fillOpacity: 0.15,
        weight: 1
    }).addTo(map);

    console.log(`✅ Localização encontrada: Lat=${latlng.lat}, Lng=${latlng.lng}`);
});

// Evento disparado em caso de erro (ex: usuário negou permissão)
map.on('locationerror', function(e) {
    console.error("❌ Erro ao obter localização:", e.message);
    alert("Erro ao obter a localização: " + e.message + " (Verifique se a permissão foi concedida ao navegador.)");
});
// FIM DAS FUNÇÕES DE LOCALIZAÇÃO DO USUÁRIO

function createPopupContent(client) {
    const phone = client.telefone ? client.telefone.replace(/\D/g, '') : '';
    const whatsappLink = phone && phone.length >= 10 ? `
        <a href="https://wa.me/55${phone}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4 mr-1 fill-current"><path d="M380.9 97.1C339.4 55.4 283.4 32 224.2 32c-122.9 0-222 99.8-222 223 0 39.1 10.3 77.2 29.8 111L3 487.6l103.5-30.9c32.7 17.7 69.8 27.1 107.7 27.1h.4c122.8 0 221.7-99.7 221.7-223.1 0-59.5-22.7-115-64.8-156.7zM224.2 448c-30.8 0-61.2-8.8-87.3-25.2l-6.1-3.6-64.8 19.3 20.3-63.5-4-6.3c-19.1-30.2-29.4-65.5-29.4-102.5 0-99.9 81-180.9 181.1-180.9 49.3 0 95.6 19.3 130.4 54.1 34.8 34.8 54 81 54 130.4 0 100.2-81.1 181.2-181.2 181.2-.4 0-.8 0-1.2 0zM361.6 314.9c-2.3-1.4-13.6-6.7-15.7-7.4-2.1-.7-3.6-1.1-5.1 1.1-1.5 2.1-5.9 7.4-7.2 8.9-1.3 1.5-2.6 1.7-4.8.6-2.2-1.1-9.3-3.4-17.7-10.9-6.5-5.9-10.8-11.8-12.1-13.9-1.3-2.1-.1-3.2 1-4.2 1-.8 2.2-2.1 3.3-3.3 1.1-1.1 1.5-2.1 2.2-3.4.7-1.3.4-2.4-.2-3.4-2.2-3.8-15.7-37.5-18-43.4-2.3-5.9-4.5-5.1-6.1-5.2-1.5-.1-3.3-.1-5.1-.1-1.8 0-4.8.7-7.4 3.7-2.6 2.9-9.8 9.6-9.8 23.4s10.1 27.1 11.5 29c1.3 1.9 20 30.6 48.6 43.8 28.5 13.1 34.4 11.9 38.8 11.1 4.4-.8 13.6-5.5 15.5-11.2s2.1-10.8.6-13.3z"/></svg>
            WhatsApp
        </a>
    ` : '';
    
    // NOVO: Link de Rota para o Google Maps
    const routeLink = (client.lat && client.lng) ? `
        <a href="https://www.google.com/maps/dir/Current+Location/${client.lat},${client.lng}" 
           target="_blank" 
           class="text-red-600 hover:text-red-800 font-semibold flex items-center mt-1">
            <svg class="h-4 w-4 mr-1 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Ver Rota no Google Maps
        </a>
    ` : '';

    const equipamentosList = client.equipamentos.map(e => `<li class="text-xs text-gray-700">${e}</li>`).join('');

    return `
        <div class="client-popup-content p-2 font-sans">
            <h3 class="text-base font-bold text-blue-700">${client.nome}</h3>
            <p class="text-sm text-gray-700">${client.cidade}</p>
            
            <p class="text-xs text-gray-500 mt-1">
                Contato: ${client.contato ? client.contato : 'N/A'} 
                <span class="font-semibold text-gray-700">| ${client.telefone ? client.telefone : 'N/A'}</span>
            </p>
            
            ${whatsappLink}
            ${routeLink}
            
            <div class="mt-2 pt-2 border-t border-gray-200">
                <p class="text-xs font-semibold text-gray-800">Equipamentos:</p>
                <ul class="list-disc list-inside ml-2 space-y-0.5">
                    ${equipamentosList}
                </ul>
            </div>
        </div>
    `;
}

function updateMarkers(clients) {
    markersCluster.clearLayers();
    const markers = [];
    
    clients.forEach((client, index) => {
        if (client.lat && client.lng) {
            const marker = L.marker([client.lat, client.lng], {
                clientIndex: index 
            });

            marker.bindPopup(createPopupContent(client));
            
            // 💡 Tooltip: Adiciona o Tooltip com o nome do cliente
            marker.bindTooltip(client.nome, {
                permanent: false, // O Tooltip só aparece ao passar o mouse
                direction: 'top', // Aparece acima do marcador
                offset: [0, -5]   
            });
            // FIM DO Tooltip

            markers.push(marker);
        }
    });

    markersCluster.addLayers(markers);
    console.log(`📍 ${markers.length} marcadores adicionados/atualizados no mapa.`);
    
    if (markers.length > 0) {
        try {
            map.fitBounds(markersCluster.getBounds(), { padding: [50, 50] });
        } catch (e) {
            map.setView([clients[0].lat, clients[0].lng], 8); 
        }
    }
}


// -------------------------------------------------------------
// Estado Global do Alpine.js (x-data="appState")
// -------------------------------------------------------------

document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        // Estado da UI: Inicia FECHADA em Mobile e ABERTA em Desktop
        sidebarOpen: window.innerWidth >= 768, 
        loadingData: true,
        errorData: false,

        // Estado dos Dados
        allClients: [],
        visibleClients: [],
        availableCities: [],

        // Estado dos Filtros
        searchQuery: '',
        cityFilter: '',

        // Função de inicialização
        initMap() {
            this.loadData();
            
            // ADICIONADO: Observa mudanças em searchQuery (agora debounced) para aplicar filtro
            this.$watch('searchQuery', () => this.filterClients());
            
            // CORREÇÃO CRUCIAL PARA MOBILE: Aumentamos o delay para 500ms
            setTimeout(() => {
                map.invalidateSize();
                console.log("📏 CORRIGIDO: Mapa invalidado após inicialização (500ms delay).");
            }, 500); 

            // Adiciona um listener extra para o evento 'load' da janela, como um fallback robusto.
            window.addEventListener('load', () => {
                map.invalidateSize();
            }, { once: true });
        },
        
        // NOVO MÉTODO: Expõe a função locateUser() global ao Alpine
        locateUser() {
            locateUser();
        },

        // MÉTODO PARA CONTROLE DA SIDEBAR
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
            
            // Força o Leaflet a recalcular o tamanho APÓS a transição da sidebar.
            setTimeout(() => {
                map.invalidateSize();
            }, 350); 
        },

        // -------------------------------------------------------------
        // Métodos de Dados
        // -------------------------------------------------------------
        async loadData() {
            this.loadingData = true;
            this.errorData = false;
            try {
                const response = await fetch('/api/clients');
                if (!response.ok) throw new Error('Falha ao buscar dados');
                const clients = await response.json();
                
                this.allClients = clients;
                
                const uniqueCities = new Set(clients.map(c => c.cidade).filter(Boolean));
                this.availableCities = Array.from(uniqueCities).sort();
                
                this.filterClients(); // Aplica filtros iniciais e atualiza o mapa
                
                console.log(`✅ ${clients.length} clientes carregados`);

            } catch (err) {
                console.error('❌ Erro ao carregar clientes:', err);
                this.errorData = true;
            } finally {
                this.loadingData = false;
            }
        },

        refreshData() {
            this.loadData();
        },

        // -------------------------------------------------------------
        // Métodos de Filtro e UI
        // -------------------------------------------------------------
        filterClients() {
            // 1. Normaliza a consulta de busca digitada
            const query = normalizeText(this.searchQuery);
            const city = this.cityFilter; // Valor do select (string original, não normalizada)

            // NOVIDADE: Implementa o filtro de 3 caracteres. Se query tem 1 ou 2 chars E não há filtro de cidade, zera a lista.
            if (query.length > 0 && query.length < 3 && !city) {
                this.visibleClients = [];
                updateMarkers(this.visibleClients);
                return; // Pára a execução do filtro
            }

            this.visibleClients = this.allClients.filter(client => {
                // Filtro do SELECT de Cidades (Usa a string original)
                const matchesCityFilter = !city || client.cidade === city;
                
                // Se a busca de texto está vazia, o filtro só depende da cidade
                if (!query) return matchesCityFilter;

                // --- Regras de Busca de Texto Normalizada ---
                
                // 1. Busca por nome (NORMALIZADA)
                const nameMatches = normalizeText(client.nome).includes(query);
                
                // 2. Busca por equipamento (NORMALIZADA)
                const equipmentMatches = client.equipamentos.some(e => 
                    normalizeText(e).includes(query)
                );
                
                // 3. Busca por cidade (NORMALIZADA)
                const citySearchMatches = normalizeText(client.cidade).includes(query);
                
                // Retorna verdadeiro se o cliente atende ao filtro do select E à busca de texto
                return matchesCityFilter && (nameMatches || equipmentMatches || citySearchMatches);
            });
            
            updateMarkers(this.visibleClients);
        },
        
        focusClient(index) {
            const client = this.visibleClients[index];
            if (client.lat && client.lng) {
                map.setView([client.lat, client.lng], 12);
                console.log(`🎯 Focando em: ${client.nome}`);
                
                // Abre o popup do marcador clicado
                markersCluster.eachLayer(cluster => {
                    cluster.eachLayer(marker => {
                        // Usa o índice salvo no marcador para encontrar o popup correto
                        if (marker.options.clientIndex === index) {
                            marker.openPopup();
                        }
                    });
                });
            }
        }
    }));
});
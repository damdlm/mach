// static/js/map.js

// Variáveis globais do mapa
let map = null;
let markersCluster = null;
let userLocationMarker = null;
let userLocationCircle = null;

/**
 * Normaliza o texto removendo acentos, cedilhas e convertendo para minúsculas.
 * Ex: 'São Paulo' -> 'sao paulo'
 */
function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Inicializa o mapa Leaflet
 */
function initializeMap() {
    console.log("🗺️ Inicializando mapa...");
    
    // Verifica se o container do mapa existe
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('❌ Container do mapa não encontrado!');
        return false;
    }

    try {
        // Inicialização do mapa
        map = L.map('map', { 
            tap: true,
            zoomControl: false 
        }).setView([-15.7801, -47.9292], 4);

        // Tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Controle de zoom
        L.control.zoom({ position: 'topright' }).addTo(map); 

        // Cluster de marcadores
        markersCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50
        });
        map.addLayer(markersCluster);

        console.log("✅ Mapa inicializado com sucesso!");
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
        return false;
    }
}

/**
 * Inicia o processo de obtenção da localização do usuário via Geolocation API.
 */
function locateUser() {
    if (!map) {
        console.error('❌ Mapa não inicializado!');
        return;
    }
    
    console.log("Procurando sua localização...");
    
    map.locate({
        setView: true, 
        maxZoom: 14,   
        enableHighAccuracy: true 
    });
}

// Configura eventos de localização apenas se o mapa foi inicializado
function setupLocationEvents() {
    if (!map) return;

    // Evento disparado quando a localização é encontrada
    map.on('locationfound', function(e) {
        const latlng = e.latlng;
        const radius = e.accuracy;
        
        // Remove o marcador e o círculo antigos, se existirem
        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
            map.removeLayer(userLocationCircle);
        }
        
        // Adiciona NOVO marcador de localização
        userLocationMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'user-location-icon',
                html: '<div style="background-color: #0078FF; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 3px #0078FF66;"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(map)
          .bindPopup(`Você está aqui!`)
          .openPopup();
        
        // Adiciona um círculo para mostrar a área de precisão
        userLocationCircle = L.circle(latlng, radius, {
            color: '#0078FF',
            fillColor: '#0078FF',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(map);

        console.log(`✅ Localização encontrada: Lat=${latlng.lat}, Lng=${latlng.lng}`);
    });

    // Evento disparado em caso de erro
    map.on('locationerror', function(e) {
        console.error("❌ Erro ao obter localização:", e.message);
        alert("Erro ao obter a localização: " + e.message + " (Verifique se a permissão foi concedida ao navegador.)");
    });
}

function createPopupContent(client) {
    const phone = client.telefone ? client.telefone.replace(/\D/g, '') : '';
    const whatsappLink = phone && phone.length >= 10 ? `
        <a href="https://wa.me/55${phone}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4 mr-1 fill-current"><path d="M380.9 97.1C339.4 55.4 283.4 32 224.2 32c-122.9 0-222 99.8-222 223 0 39.1 10.3 77.2 29.8 111L3 487.6l103.5-30.9c32.7 17.7 69.8 27.1 107.7 27.1h.4c122.8 0 221.7-99.7 221.7-223.1 0-59.5-22.7-115-64.8-156.7zM224.2 448c-30.8 0-61.2-8.8-87.3-25.2l-6.1-3.6-64.8 19.3 20.3-63.5-4-6.3c-19.1-30.2-29.4-65.5-29.4-102.5 0-99.9 81-180.9 181.1-180.9 49.3 0 95.6 19.3 130.4 54.1 34.8 34.8 54 81 54 130.4 0 100.2-81.1 181.2-181.2 181.2-.4 0-.8 0-1.2 0zM361.6 314.9c-2.3-1.4-13.6-6.7-15.7-7.4-2.1-.7-3.6-1.1-5.1 1.1-1.5 2.1-5.9 7.4-7.2 8.9-1.3 1.5-2.6 1.7-4.8.6-2.2-1.1-9.3-3.4-17.7-10.9-6.5-5.9-10.8-11.8-12.1-13.9-1.3-2.1-.1-3.2 1-4.2 1-.8 2.2-2.1 3.3-3.3 1.1-1.1 1.5-2.1 2.2-3.4.7-1.3.4-2.4-.2-3.4-2.2-3.8-15.7-37.5-18-43.4-2.3-5.9-4.5-5.1-6.1-5.2-1.5-.1-3.3-.1-5.1-.1-1.8 0-4.8.7-7.4 3.7-2.6 2.9-9.8 9.6-9.8 23.4s10.1 27.1 11.5 29c1.3 1.9 20 30.6 48.6 43.8 28.5 13.1 34.4 11.9 38.8 11.1 4.4-.8 13.6-5.5 15.5-11.2s2.1-10.8.6-13.3z"/></svg>
            WhatsApp
        </a>
    ` : '';
    
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
    if (!markersCluster) {
        console.error('❌ Cluster de marcadores não inicializado!');
        return;
    }
    
    markersCluster.clearLayers();
    const markers = [];
    
    clients.forEach((client, index) => {
        if (client.lat && client.lng) {
            const marker = L.marker([client.lat, client.lng], {
                clientIndex: index 
            });

            marker.bindPopup(createPopupContent(client));
            
            marker.bindTooltip(client.nome, {
                permanent: false,
                direction: 'top',
                offset: [0, -5]   
            });

            markers.push(marker);
        }
    });

    markersCluster.addLayers(markers);
    console.log(`📍 ${markers.length} marcadores adicionados/atualizados no mapa.`);
    
    if (markers.length > 0 && map) {
        try {
            map.fitBounds(markersCluster.getBounds(), { padding: [50, 50] });
        } catch (e) {
            console.warn('⚠️ Erro ao ajustar bounds, definindo view padrão');
            if (clients[0].lat && clients[0].lng) {
                map.setView([clients[0].lat, clients[0].lng], 8); 
            }
        }
    }
}

// -------------------------------------------------------------
// Estado Global do Alpine.js (x-data="appState")
// -------------------------------------------------------------

document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        // Estado da UI
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
        async initMap() {
            console.log("🚀 Iniciando aplicação...");
            
            // 1. Inicializa o mapa primeiro
            const mapInitialized = initializeMap();
            if (!mapInitialized) {
                this.errorData = true;
                this.loadingData = false;
                return;
            }
            
            // 2. Configura eventos de localização
            setupLocationEvents();
            
            // 3. Carrega os dados
            await this.loadData();
            
            // 4. Configura watchers
            this.$watch('searchQuery', () => this.filterClients());
            
            // 5. Corrige tamanho do mapa após inicialização
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    console.log("📏 Mapa invalidado após inicialização");
                }
            }, 500);

            window.addEventListener('load', () => {
                if (map) map.invalidateSize();
            }, { once: true });
        },
        
        locateUser() {
            locateUser();
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
            
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 350);
        },

        async loadData() {
            this.loadingData = true;
            this.errorData = false;
            
            const minLoadingTime = 1500;
            const startTime = Date.now();
            
            try {
                const response = await fetch('/api/clients');
                if (!response.ok) throw new Error('Falha ao buscar dados');
                const clients = await response.json();
                
                this.allClients = clients;
                
                const uniqueCities = new Set(clients.map(c => c.cidade).filter(Boolean));
                this.availableCities = Array.from(uniqueCities).sort();
                
                this.filterClients();
                
                console.log(`✅ ${clients.length} clientes carregados`);

            } catch (err) {
                console.error('❌ Erro ao carregar clientes:', err);
                this.errorData = true;
            } finally {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                setTimeout(() => {
                    this.loadingData = false;
                }, remainingTime);
            }
        },

        refreshData() {
            this.loadData();
        },

        filterClients() {
            const query = normalizeText(this.searchQuery);
            const city = this.cityFilter;

            if (query.length > 0 && query.length < 3 && !city) {
                this.visibleClients = [];
                updateMarkers(this.visibleClients);
                return;
            }

            this.visibleClients = this.allClients.filter(client => {
                const matchesCityFilter = !city || client.cidade === city;
                
                if (!query) return matchesCityFilter;

                const nameMatches = normalizeText(client.nome).includes(query);
                const equipmentMatches = client.equipamentos.some(e => 
                    normalizeText(e).includes(query)
                );
                const citySearchMatches = normalizeText(client.cidade).includes(query);
                
                return matchesCityFilter && (nameMatches || equipmentMatches || citySearchMatches);
            });
            
            updateMarkers(this.visibleClients);
        },
        
        confirmLogout() {
            Swal.fire({
                title: 'Realmente deseja sair?',
                icon: 'question',
                iconColor: '#ef4444',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sim',
                cancelButtonText: 'Cancelar',
                background: '#ffffff',
                color: '#1f2937',
                backdrop: `
                    rgba(0, 0, 0, 0.4)
                    url("/static/images/nyan-cat.gif")
                    left top
                    no-repeat
                `,
                customClass: {
                    popup: 'rounded-2xl shadow-2xl',
                    title: 'text-lg font-semibold text-gray-800',
                    confirmButton: 'px-7 py-2 rounded-lg font-medium',
                    cancelButton: 'px-3 py-2 rounded-lg font-medium'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/logout';
                }
            });
        },		
		
        focusClient(index) {
            const client = this.visibleClients[index];
            if (client.lat && client.lng && map) {
                map.setView([client.lat, client.lng], 12);
                console.log(`🎯 Focando em: ${client.nome}`);
                
                if (markersCluster) {
                    markersCluster.eachLayer(cluster => {
                        cluster.eachLayer(marker => {
                            if (marker.options.clientIndex === index) {
                                marker.openPopup();
                            }
                        });
                    });
                }
            }
        }
    }));
});

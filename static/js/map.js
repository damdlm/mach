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
	
    const formattedPhone = client.telefone ? client.telefone : 'N/A';
    
    // CORREÇÃO 1: Link do WhatsApp agora exibe o número de telefone
    const whatsappLink = phone && phone.length >= 10 ? `
        <a href="https://wa.me/55${phone}" 
		   target="_blank" 
		   style="color: #10B981;"
            onmouseover="this.style.color='#047857'" 
            onmouseout="this.style.color='#10B981'" 
           class="text-green-600 hover:text-green-800 font-semibold flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 32 32" 
              fill="currentColor" 
              class="h-5 w-5 mr-1">
              <path d="M16.004 3C9.372 3 4 8.37 4 15c0 2.423.65 4.775 1.885 6.853L4 29l7.333-1.889A11.91 11.91 0 0 0 16.004 27C22.636 27 28 21.63 28 15S22.636 3 16.004 3zm0 21.695a9.678 9.678 0 0 1-4.916-1.342l-.353-.209-4.354 1.123 1.16-4.246-.226-.362a9.67 9.67 0 0 1-1.502-5.084c0-5.361 4.36-9.72 9.728-9.72a9.65 9.65 0 0 1 9.724 9.716c0 5.36-4.36 9.724-9.724 9.724zm5.56-7.267c-.304-.15-1.803-.889-2.083-.989-.28-.102-.484-.151-.687.15-.203.304-.789.987-.967 1.19-.178.203-.356.228-.66.076-.304-.152-1.282-.473-2.44-1.506-.902-.804-1.51-1.795-1.687-2.098-.177-.303-.019-.466.133-.618.137-.137.304-.355.456-.532.152-.178.203-.304.304-.507.102-.203.051-.38-.025-.532-.076-.152-.684-1.646-.937-2.259-.247-.592-.497-.511-.686-.521-.178-.009-.38-.011-.583-.011a1.125 1.125 0 0 0-.812.38c-.279.304-1.07 1.045-1.07 2.551 0 1.507 1.095 2.962 1.247 3.165.152.203 2.158 3.296 5.23 4.474.73.317 1.3.506 1.742.648.731.232 1.397.2 1.922.122.586-.088 1.803-.736 2.059-1.448.254-.711.254-1.324.178-1.448-.076-.122-.277-.203-.58-.354z"/>
            </svg>           
			${formattedPhone}
        </a>
    ` : '';
    
    // CORREÇÃO 2: Link de Rota usando URL padrão do Google Maps e texto "Rota"
    const routeLink = (client.lat && client.lng) ? `
        <a href="https://www.google.com/maps/dir/?api=1&destination=${client.lat},${client.lng}" 
           target="_blank" 
		   style="color: #EF4444;"
           onmouseover="this.style.color='#b91c1c'" 
           onmouseout="this.style.color='#EF4444'"
           class="text-red-600 hover:text-red-800 font-semibold flex items-center mt-1">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="h-4 w-4 mr-1 fill-current">
            <path d="M172.268 501.67C272.268 393.45 384 290.7 384 192C384 86 298.6 0 192 0S0 86 0 192c0 98.7 111.732 201.45 211.732 309.67c12.32 12.82 32.84 12.82 45.16 0zM192 272c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z"/>
           </svg>
            Rota Google Maps
        </a>
    ` : '';

    const equipamentosList = client.equipamentos.map(e => `<li class="text-xs text-gray-700">${e}</li>`).join('');

    return `
        <div class="client-popup-content p-3 font-sans">
            <h3 class="text-base font-bold text-gray-800">${client.nome}</h3>
			
            <p class="text-sm text-gray-700">${client.cidade}</p>
            
            <p class="text-xs text-gray-600 mt-1">
                Contato: ${client.contato ? client.contato : 'N/A'}
            </p>
            
            ${whatsappLink}
			
			<div style="height: 0.7em;"></div>
			
            ${routeLink}
            
            <div class="mt-2 pt-0 border-t border-gray-300">
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

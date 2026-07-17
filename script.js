/**
 * ==========================================================================
 * SIMULADOR INTERACTIVO DE ÁRBOLES BINARIOS - ESTRUCTURA DE DATOS
 * Codigo en JavaScript Vanilla para Practica Universitaria
 * ==========================================================================
 */

// --- CLASE NODO ÁRBOL ---
// Representa un nodo individual en un árbol binario clásico
class NodoArbol {
    constructor(valor) {
        this.valor = valor;        // Etiqueta/Letra del nodo
        this.izquierda = null;     // Puntero al subárbol izquierdo (NodoArbol)
        this.derecha = null;       // Puntero al subárbol derecho (NodoArbol)
        this.x = 0;                // Coordenada X calculada para renderizado
        this.y = 0;                // Coordenada Y calculada para renderizado
    }
}

// --- CONFIGURACIÓN DE ÁRBOLES DE EJEMPLO (PRESETS) ---

/**
 * Crea el Árbol A: Árbol binario lleno y perfectamente balanceado (7 nodos, 3 niveles)
 *           A
 *         /   \
 *        B     C
 *       / \   / \
 *      D   E F   G
 */
function crearArbolA() {
    const root = new NodoArbol('A');
    const b = new NodoArbol('B');
    const c = new NodoArbol('C');
    const d = new NodoArbol('D');
    const e = new NodoArbol('E');
    const f = new NodoArbol('F');
    const g = new NodoArbol('G');

    root.izquierda = b;
    root.derecha = c;
    b.izquierda = d;
    b.derecha = e;
    c.izquierda = f;
    c.derecha = g;

    return root;
}

/**
 * Crea el Árbol B: Árbol binario irregular y asimétrico (9 nodos, 4 niveles)
 *               A
 *             /   \
 *            B     C
 *           /     / \
 *          D     E   F
 *         / \     \
 *        G   H     I
 */
function crearArbolB() {
    const root = new NodoArbol('A');
    const b = new NodoArbol('B');
    const c = new NodoArbol('C');
    const d = new NodoArbol('D');
    const e = new NodoArbol('E');
    const f = new NodoArbol('F');
    const g = new NodoArbol('G');
    const h = new NodoArbol('H');
    const i = new NodoArbol('I');

    root.izquierda = b;
    root.derecha = c;

    b.izquierda = d;

    c.izquierda = e;
    c.derecha = f;

    d.izquierda = g;
    d.derecha = h;

    e.derecha = i;

    return root;
}

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let arbolActual = null;             // Puntero a la raíz del árbol cargado
let nombreArbolActual = 'A';        // Nombre del preajuste activo ('A' o 'B')
let recorridoSeleccionado = 'preorder'; // Tipo de recorrido activo ('preorder', 'inorder', etc.)
let pasosAnimacion = [];            // Almacén de pasos calculados secuencialmente
let indicePasoActual = -1;          // Índice del paso en ejecución (-1 indica sin iniciar)
let temporizadorAnimacion = null;   // Manejador del setTimeout para la reproducción continua
let enReproduccion = false;         // Estado del reproductor (reproduciendo o pausado)
let audioHabilitado = false;        // Estado de silenciador
let contextoAudio = null;           // Contexto de Web Audio API para síntesis de sonido

// --- NUEVOS ESTADOS DE MEJORAS (TEMA) ---
let preferenciaTema = 'dark';       // 'dark' (defecto) o 'light'
let tipoNodoBuilder = 'number';     // 'number' o 'letter'
let panModeEnabled = false;         // Modo mover pizarra activo o no
let isPanning = false;              // Drag de pizarra en progreso
let panState = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
let viewportOffset = { x: 0, y: 0 }; // Desplazamiento actual del viewport SVG

// --- ELEMENTOS DEL DOM ---
const svgTree = document.getElementById('tree-svg');
const svgContainer = document.getElementById('svg-canvas-container');
const svgViewport = document.getElementById('svg-viewport');
const edgesGroup = document.getElementById('edges-group');
const nodesGroup = document.getElementById('nodes-group');

const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnReset = document.getElementById('btn-reset');
const btnPanMode = document.getElementById('btn-pan-mode');
const btnRandomLetters = document.getElementById('btn-random-letters');
const btnRandomNumbers = document.getElementById('btn-random-numbers');
const btnSound = document.getElementById('btn-sound');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');

const speedSlider = document.getElementById('speed-slider');
const traversalTabs = document.querySelectorAll('.traversal-tabs .tab-btn');
const infoBox = document.getElementById('traversal-info-box');

const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const consoleOutput = document.getElementById('console-output');
const sequenceContainer = document.getElementById('traversal-sequence');

const structureTypeLabel = document.getElementById('structure-type-label');
const structureContainer = document.getElementById('structure-container');

// Nuevos Elementos DOM de la Cabecera (Tema)
const btnTheme = document.getElementById('btn-theme');
const themeDarkIcon = document.getElementById('theme-dark-icon');
const themeLightIcon = document.getElementById('theme-light-icon');

// Nuevos Componentes de Aprendizaje y Utilerías
const metricHeight = document.getElementById('metric-height');
const metricCount = document.getElementById('metric-count');
const pseudocodeList = document.getElementById('pseudocode-list');
const nodeTooltip = document.getElementById('node-tooltip');
const btnCopyResult = document.getElementById('btn-copy-result');
const btnCopyText = document.getElementById('btn-copy-text');

// --- SINTETIZADOR DE SONIDO (WEB AUDIO API) ---
/**
 * Genera un pitido electrónico limpio utilizando osciladores puros.
 * No requiere archivos de audio externos y es seguro de reproducir localmente.
 */
function reproducirPitido(frecuencia = 523.25, duracionMs = 150) {
    if (!audioHabilitado) return;
    try {
        // Inicializar el contexto si es la primera vez
        if (!contextoAudio) {
            contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Reanudar si está suspendido (políticas del navegador de interacción de usuario)
        if (contextoAudio.state === 'suspended') {
            contextoAudio.resume();
        }

        const oscilador = contextoAudio.createOscillator();
        const nodoGanancia = contextoAudio.createGain();

        oscilador.connect(nodoGanancia);
        nodoGanancia.connect(contextoAudio.destination);

        oscilador.type = 'sine'; // Onda senoidal pura y suave
        oscilador.frequency.setValueAtTime(frecuencia, contextoAudio.currentTime);

        // Configurar envolvente de volumen para evitar chasquidos (Fade-out exponencial)
        nodoGanancia.gain.setValueAtTime(0.12, contextoAudio.currentTime);
        nodoGanancia.gain.exponentialRampToValueAtTime(0.0001, contextoAudio.currentTime + duracionMs / 1000);

        oscilador.start(contextoAudio.currentTime);
        oscilador.stop(contextoAudio.currentTime + duracionMs / 1000);
    } catch (error) {
        console.warn("Web Audio API no soportada o bloqueada:", error);
    }
}

// --- CÁLCULO DE COORDENADAS ---
/**
 * Calcula de forma recursiva y dinámica las coordenadas (X, Y) de cada nodo.
 * Esto permite adaptar el tamaño y la distribución del árbol proporcionalmente.
 * 
 * @param {NodoArbol} nodo - Nodo actual procesado
 * @param {number} x - Coordenada X propuesta
 * @param {number} y - Coordenada Y propuesta
 * @param {number} nivel - Nivel de profundidad actual (raíz es nivel 0)
 * @param {number} factorDesplazamiento - Espacio horizontal libre para los hijos
 */
function calcularPosiciones(nodo, x, y, nivel, factorDesplazamiento) {
    if (!nodo) return;

    nodo.x = x;
    nodo.y = y;
    nodo.nivel = nivel; // Guardamos profundidad para el retraso en cascada

    const distanciaVertical = 100; // Separación de 100px entre niveles (pizarra más grande)
    const separacionMinima = 120 + (nivel * 10);
    const desplazamientoHijo = Math.max(factorDesplazamiento * 0.7, separacionMinima);

    if (nodo.izquierda) {
        calcularPosiciones(nodo.izquierda, x - factorDesplazamiento, y + distanciaVertical, nivel + 1, desplazamientoHijo);
    }
    if (nodo.derecha) {
        calcularPosiciones(nodo.derecha, x + factorDesplazamiento, y + distanciaVertical, nivel + 1, desplazamientoHijo);
    }
}

// --- RENDERIZADO DEL ÁRBOL EN SVG ---
/**
 * Dibuja las líneas de conexión (aristas) y los círculos (nodos) en el lienzo SVG especificado.
 */
function renderizarArbol(raiz, edgesG = edgesGroup, nodesG = nodesGroup, idPrefijo = "") {
    // Limpiar elementos anteriores
    edgesG.innerHTML = '';
    nodesG.innerHTML = '';

    // Asegurar que los grupos existan incluso si no se pasan explícitamente
    if (!edgesG || !nodesG) return;

    if (!raiz) return;

    const nodosAProcesar = [raiz];
    const aristasADibujar = [];

    // Recorrer el árbol en anchura (BFS) para recolectar todos los elementos a renderizar
    while (nodosAProcesar.length > 0) {
        const nodo = nodosAProcesar.shift();

        if (nodo.izquierda) {
            aristasADibujar.push({
                id: `${idPrefijo}edge-${nodo.valor}-${nodo.izquierda.valor}`,
                x1: nodo.x, y1: nodo.y,
                x2: nodo.izquierda.x, y2: nodo.izquierda.y
            });
            nodosAProcesar.push(nodo.izquierda);
        }

        if (nodo.derecha) {
            aristasADibujar.push({
                id: `${idPrefijo}edge-${nodo.valor}-${nodo.derecha.valor}`,
                x1: nodo.x, y1: nodo.y,
                x2: nodo.derecha.x, y2: nodo.derecha.y
            });
            nodosAProcesar.push(nodo.derecha);
        }

        // Crear elementos visuales para el nodo actual
        const gNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gNode.setAttribute('class', 'node');
        gNode.setAttribute('id', `${idPrefijo}node-${nodo.valor}`);
        gNode.setAttribute('data-valor', nodo.valor);
        gNode.setAttribute('data-node-id', `${idPrefijo}node-${nodo.valor}`);

        // Animación en cascada: ajustar origen de escala y delay
        gNode.style.transformOrigin = `${nodo.x}px ${nodo.y}px`;
        gNode.style.animationDelay = `${(nodo.nivel || 0) * 0.12}s`;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodo.x);
        circle.setAttribute('cy', nodo.y);
        circle.setAttribute('r', 22);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', nodo.x);
        text.setAttribute('y', nodo.y);
        text.textContent = nodo.valor;

        gNode.appendChild(circle);
        gNode.appendChild(text);
        nodesG.appendChild(gNode);
    }

    // Dibujar las aristas primero para que queden detrás de las burbujas de los nodos
    aristasADibujar.forEach(arista => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('id', arista.id);
        line.setAttribute('class', 'edge');
        line.setAttribute('x1', arista.x1);
        line.setAttribute('y1', arista.y1);
        line.setAttribute('x2', arista.x2);
        line.setAttribute('y2', arista.y2);
        edgesG.appendChild(line);
    });
}

// --- ALGORITMOS DE RECORRIDO (GENERADORES DE PASOS) ---

/**
 * Recorrido Preorden (Raíz -> Izquierda -> Derecha)
 * Explica recursivamente el nodo activo, luego su hijo izquierdo y luego el derecho.
 */
function generarPasosPreorder(raiz) {
    const pasos = [];
    const visitados = [];
    const aristasVisitadas = [];

    // Líneas del pseudocódigo preorder (índice 0-4):
    // 0: función preorden(nodo):
    // 1:   si nodo == nulo: retornar
    // 2:   visitar(nodo)
    // 3:   preorden(nodo.izquierda)
    // 4:   preorden(nodo.derecha)

    function recorrer(nodo, padre = null, pilaLlamadas = []) {
        // Paso: verificar si nodo es nulo (línea 1)
        if (!nodo) {
            const pilaActual = [...pilaLlamadas];
            pasos.push({
                idNodoActivo: null,
                idAristaActiva: null,
                listaNodosVisitados: [...visitados],
                listaAristasVisitadas: [...aristasVisitadas],
                mensajeExplicativo: `<strong>Caso base:</strong> El nodo es <code>nulo</code>. Se retorna sin hacer nada.`,
                estadoMemoria: pilaActual,
                frecuenciaSonido: null,
                lineaPseudo: 1
            });
            return;
        }

        const pilaActual = [...pilaLlamadas, nodo.valor];
        const idAristaActiva = padre ? `${padre.valor}-${nodo.valor}` : null;

        // Paso: VISITAR nodo (línea 2)
        visitados.push(nodo.valor);
        if (idAristaActiva) aristasVisitadas.push(idAristaActiva);

        let explicacion = "";
        if (!padre) {
            explicacion = `Iniciamos el recorrido <strong>Preorden</strong> en el nodo raíz <strong>${nodo.valor}</strong>. Regla: Raíz &rarr; Izquierda &rarr; Derecha. Se visita este nodo primero.`;
        } else {
            const direccion = padre.izquierda === nodo ? 'izquierdo' : 'derecho';
            explicacion = `Visitamos el hijo <strong>${direccion}</strong>: nodo <strong>${nodo.valor}</strong> (hijo de ${padre.valor}). Se agrega al resultado de inmediato.`;
        }
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: explicacion,
            estadoMemoria: pilaActual,
            frecuenciaSonido: obtenerFrecuencia(nodo.valor),
            lineaPseudo: 2
        });

        // Paso: llamar recursivamente al hijo izquierdo (línea 3)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>preorden(${nodo.valor}.izquierda)</code>. Descendemos al subárbol <strong>izquierdo</strong> de ${nodo.valor}.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 3
        });
        recorrer(nodo.izquierda, nodo, pilaActual);

        // Paso: llamar recursivamente al hijo derecho (línea 4)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>preorden(${nodo.valor}.derecha)</code>. Descendemos al subárbol <strong>derecho</strong> de ${nodo.valor}.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 4
        });
        recorrer(nodo.derecha, nodo, pilaActual);
    }

    recorrer(raiz);
    return pasos;
}

/**
 * Recorrido Inorden (Izquierda -> Raíz -> Derecha)
 * Recorre recursivamente hasta el subárbol izquierdo, visita el padre y finalmente el subárbol derecho.
 */
function generarPasosInorder(raiz) {
    const pasos = [];
    const visitados = [];
    const aristasVisitadas = [];

    // Líneas del pseudocódigo inorder (índice 0-4):
    // 0: función inorden(nodo):
    // 1:   si nodo == nulo: retornar
    // 2:   inorden(nodo.izquierda)
    // 3:   visitar(nodo)
    // 4:   inorden(nodo.derecha)

    function recorrer(nodo, padre = null, pilaLlamadas = []) {
        // Paso: verificar si nodo es nulo (línea 1)
        if (!nodo) {
            pasos.push({
                idNodoActivo: null,
                idAristaActiva: null,
                listaNodosVisitados: [...visitados],
                listaAristasVisitadas: [...aristasVisitadas],
                mensajeExplicativo: `<strong>Caso base:</strong> El nodo es <code>nulo</code>. Se retorna sin hacer nada.`,
                estadoMemoria: [...pilaLlamadas],
                frecuenciaSonido: null,
                lineaPseudo: 1
            });
            return;
        }

        const pilaActual = [...pilaLlamadas, nodo.valor];
        const idAristaActiva = padre ? `${padre.valor}-${nodo.valor}` : null;

        // Paso: llamar al hijo izquierdo (línea 2)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>inorden(${nodo.valor}.izquierda)</code>. Descendemos al subárbol <strong>izquierdo</strong> de ${nodo.valor} antes de visitar.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 2
        });
        recorrer(nodo.izquierda, nodo, pilaActual);

        // Paso: VISITAR el nodo (línea 3)
        visitados.push(nodo.valor);
        if (idAristaActiva && !aristasVisitadas.includes(idAristaActiva)) {
            aristasVisitadas.push(idAristaActiva);
        }

        let explicacion = "";
        if (!padre) {
            explicacion = `Subárbol izquierdo completado. Subimos a la raíz <strong>${nodo.valor}</strong> y la visitamos ahora.`;
        } else if (nodo.izquierda && visitados.includes(nodo.izquierda.valor)) {
            explicacion = `Regresamos del subárbol izquierdo. Visitamos el nodo <strong>${nodo.valor}</strong> (hijo de ${padre.valor}).`;
        } else if (padre.izquierda === nodo) {
            explicacion = `Extremo izquierdo más profundo: sin hijo izquierdo. Visitamos el nodo hoja <strong>${nodo.valor}</strong>.`;
        } else {
            explicacion = `Subárbol izquierdo de ${padre.valor} completo. Visitamos el hijo derecho <strong>${nodo.valor}</strong>.`;
        }
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: explicacion,
            estadoMemoria: pilaActual,
            frecuenciaSonido: obtenerFrecuencia(nodo.valor),
            lineaPseudo: 3
        });

        // Paso: llamar al hijo derecho (línea 4)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>inorden(${nodo.valor}.derecha)</code>. Descendemos al subárbol <strong>derecho</strong> de ${nodo.valor}.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 4
        });
        recorrer(nodo.derecha, nodo, pilaActual);
    }

    recorrer(raiz);
    return pasos;
}

/**
 * Recorrido Postorden (Izquierda -> Derecha -> Raíz)
 * Visita primero los descendientes izquierdos, luego los derechos, y por último el padre.
 */
function generarPasosPostorder(raiz) {
    const pasos = [];
    const visitados = [];
    const aristasVisitadas = [];

    // Líneas del pseudocódigo postorder (índice 0-4):
    // 0: función postorden(nodo):
    // 1:   si nodo == nulo: retornar
    // 2:   postorden(nodo.izquierda)
    // 3:   postorden(nodo.derecha)
    // 4:   visitar(nodo)

    function recorrer(nodo, padre = null, pilaLlamadas = []) {
        // Paso: verificar si nodo es nulo (línea 1)
        if (!nodo) {
            pasos.push({
                idNodoActivo: null,
                idAristaActiva: null,
                listaNodosVisitados: [...visitados],
                listaAristasVisitadas: [...aristasVisitadas],
                mensajeExplicativo: `<strong>Caso base:</strong> El nodo es <code>nulo</code>. Se retorna sin hacer nada.`,
                estadoMemoria: [...pilaLlamadas],
                frecuenciaSonido: null,
                lineaPseudo: 1
            });
            return;
        }

        const pilaActual = [...pilaLlamadas, nodo.valor];
        const idAristaActiva = padre ? `${padre.valor}-${nodo.valor}` : null;

        // Paso: llamar al hijo izquierdo (línea 2)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>postorden(${nodo.valor}.izquierda)</code>. Descendemos al subárbol <strong>izquierdo</strong> de ${nodo.valor} primero.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 2
        });
        recorrer(nodo.izquierda, nodo, pilaActual);

        // Paso: llamar al hijo derecho (línea 3)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `Llamada recursiva: <code>postorden(${nodo.valor}.derecha)</code>. Descendemos al subárbol <strong>derecho</strong> de ${nodo.valor}.`,
            estadoMemoria: pilaActual,
            frecuenciaSonido: null,
            lineaPseudo: 3
        });
        recorrer(nodo.derecha, nodo, pilaActual);

        // Paso: VISITAR el nodo (línea 4)
        visitados.push(nodo.valor);
        if (idAristaActiva && !aristasVisitadas.includes(idAristaActiva)) {
            aristasVisitadas.push(idAristaActiva);
        }

        let explicacion = "";
        if (!padre) {
            explicacion = `Subárboles izquierdo y derecho completamente recorridos. Finalmente visitamos la raíz principal <strong>${nodo.valor}</strong>.`;
        } else if (nodo.izquierda || nodo.derecha) {
            explicacion = `Ambos hijos de <strong>${nodo.valor}</strong> ya fueron procesados. Ahora subimos y visitamos este nodo.`;
        } else if (padre.derecha === nodo) {
            explicacion = `Nodo hoja derecho <strong>${nodo.valor}</strong> (hijo de ${padre.valor}): sin hijos que procesar. Se visita.`;
        } else {
            explicacion = `Nodo hoja izquierdo <strong>${nodo.valor}</strong> (hijo de ${padre.valor}): sin hijos que procesar. Se visita.`;
        }
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: explicacion,
            estadoMemoria: pilaActual,
            frecuenciaSonido: obtenerFrecuencia(nodo.valor),
            lineaPseudo: 4
        });
    }

    recorrer(raiz);
    return pasos;
}

/**
 * Recorrido por Niveles (BFS - Breadth First Search)
 * Explora el árbol horizontalmente nivel por nivel usando una cola de nodos.
 */
function generarPasosLevelorder(raiz) {
    const pasos = [];
    const visitados = [];
    const aristasVisitadas = [];

    // Líneas del pseudocódigo BFS (índice 0-4):
    // 0: función bfs(raiz):
    // 1:   crear cola Q; Q.encolar(raiz)
    // 2:   mientras Q no esté vacía:
    // 3:     nodo = Q.desencolar(); visitar(nodo)
    // 4:     Q.encolar(hijos de nodo)

    if (!raiz) return pasos;

    // Paso inicial: encolar raíz (línea 1)
    pasos.push({
        idNodoActivo: null,
        idAristaActiva: null,
        listaNodosVisitados: [],
        listaAristasVisitadas: [],
        mensajeExplicativo: `<strong>Inicialización BFS:</strong> Creamos la cola Q y encolamos la raíz <strong>${raiz.valor}</strong>. La cola empieza con: [${raiz.valor}].`,
        estadoMemoria: [raiz.valor],
        frecuenciaSonido: null,
        lineaPseudo: 1
    });

    const cola = [{ nodo: raiz, padre: null }];

    while (cola.length > 0) {
        // Paso: verificar que la cola no está vacía (línea 2)
        const estadoColaAntes = cola.map(item => item.nodo.valor);
        pasos.push({
            idNodoActivo: null,
            idAristaActiva: null,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: `<strong>Condición del bucle:</strong> La cola Q no está vacía (contiene [${estadoColaAntes.join(', ')}]). Continuamos el recorrido.`,
            estadoMemoria: estadoColaAntes,
            frecuenciaSonido: null,
            lineaPseudo: 2
        });

        // Desencolamos el primer elemento (FIFO)
        const { nodo, padre } = cola.shift();

        visitados.push(nodo.valor);
        const idAristaActiva = padre ? `${padre.valor}-${nodo.valor}` : null;
        if (idAristaActiva) aristasVisitadas.push(idAristaActiva);

        let explicacion = "";
        if (!padre) {
            explicacion = `Desencolamos la raíz <strong>${nodo.valor}</strong> del frente de la cola. La visitamos y la agregamos al resultado.`;
        } else {
            explicacion = `Desencolamos <strong>${nodo.valor}</strong> (hijo de ${padre.valor}) del frente de la cola. Se registra su visita en la secuencia.`;
        }

        // Paso: desencolar y visitar (línea 3)
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: explicacion,
            estadoMemoria: cola.map(i => i.nodo.valor),
            frecuenciaSonido: obtenerFrecuencia(nodo.valor),
            lineaPseudo: 3
        });

        // Agregar los hijos a la cola
        const hijosEncolados = [];
        if (nodo.izquierda) {
            cola.push({ nodo: nodo.izquierda, padre: nodo });
            hijosEncolados.push(nodo.izquierda.valor);
        }
        if (nodo.derecha) {
            cola.push({ nodo: nodo.derecha, padre: nodo });
            hijosEncolados.push(nodo.derecha.valor);
        }

        // Paso: encolar hijos (línea 4)
        let expEncolado = "";
        if (hijosEncolados.length > 0) {
            expEncolado = `Encolamos los hijos de <strong>${nodo.valor}</strong>: <strong>[${hijosEncolados.join(', ')}]</strong>. Cola actual: [${cola.map(i => i.nodo.valor).join(', ')}].`;
        } else {
            expEncolado = `<strong>${nodo.valor}</strong> es un nodo hoja: no tiene hijos que encolar. Cola actual: ${cola.length === 0 ? '[] (vacía)' : '[' + cola.map(i => i.nodo.valor).join(', ') + ']'}.`;
        }
        pasos.push({
            idNodoActivo: nodo.valor,
            idAristaActiva: idAristaActiva,
            listaNodosVisitados: [...visitados],
            listaAristasVisitadas: [...aristasVisitadas],
            mensajeExplicativo: expEncolado,
            estadoMemoria: cola.map(i => i.nodo.valor),
            frecuenciaSonido: null,
            lineaPseudo: 4
        });
    }

    return pasos;
}

/**
 * Devuelve una frecuencia musical diferente según la letra del nodo
 * para lograr una melodía educativa y armónica agradable.
 */
function obtenerFrecuencia(letra) {
    const notas = {
        'A': 261.63, // Do (C4)
        'B': 293.66, // Re (D4)
        'C': 329.63, // Mi (E4)
        'D': 349.23, // Fa (F4)
        'E': 392.00, // Sol (G4)
        'F': 440.00, // La (A4)
        'G': 493.88, // Si (B4)
        'H': 523.25, // Do (C5)
        'I': 587.33  // Re (D5)
    };
    return notas[letra] || 440;
}

// --- ACTUALIZACIÓN DE INTERFAZ Y NAVEGACIÓN ---

/**
 * Calcula recursivamente la altura de un árbol binario.
 * La altura es el camino más largo desde la raíz hasta una hoja.
 */
function calcularAltura(nodo) {
    if (!nodo) return 0;
    return 1 + Math.max(calcularAltura(nodo.izquierda), calcularAltura(nodo.derecha));
}

/**
 * Renderiza dinámicamente las líneas del pseudocódigo según el recorrido seleccionado.
 */
function actualizarPseudocodigo() {
    pseudocodeList.innerHTML = '';
    let lineas = [];
    if (recorridoSeleccionado === 'preorder') {
        lineas = [
            "función preorden(nodo):",
            "  si nodo == nulo: retornar",
            "  visitar(nodo)",
            "  preorden(nodo.izquierda)",
            "  preorden(nodo.derecha)"
        ];
    } else if (recorridoSeleccionado === 'inorder') {
        lineas = [
            "función inorden(nodo):",
            "  si nodo == nulo: retornar",
            "  inorden(nodo.izquierda)",
            "  visitar(nodo)",
            "  inorden(nodo.derecha)"
        ];
    } else if (recorridoSeleccionado === 'postorder') {
        lineas = [
            "función postorden(nodo):",
            "  si nodo == nulo: retornar",
            "  postorden(nodo.izquierda)",
            "  postorden(nodo.derecha)",
            "  visitar(nodo)"
        ];
    } else if (recorridoSeleccionado === 'levelorder') {
        lineas = [
            "función bfs(raiz):",
            "  crear cola Q; Q.encolar(raiz)",
            "  mientras Q no esté vacía:",
            "    nodo = Q.desencolar(); visitar(nodo)",
            "    Q.encolar(hijos de nodo)"
        ];
    }

    lineas.forEach(lin => {
        const li = document.createElement('li');
        li.className = 'pseudo-line';
        li.innerText = lin;
        pseudocodeList.appendChild(li);
    });
}

/**
 * Pre-calcula los pasos para el recorrido seleccionado en el árbol cargado.
 */
function inicializarRecorrido() {
    pararReproduccion();
    indicePasoActual = -1;

    if (recorridoSeleccionado === 'preorder') {
        pasosAnimacion = generarPasosPreorder(arbolActual);
        infoBox.innerHTML = `<strong>Preorden:</strong> Raíz &rarr; Izquierda &rarr; Derecha. Visita primero la raíz actual, luego el subárbol izquierdo y después el subárbol derecho de forma recursiva.`;
        structureTypeLabel.innerText = "Memoria: Pila de Recursión (Call Stack)";
    } else if (recorridoSeleccionado === 'inorder') {
        pasosAnimacion = generarPasosInorder(arbolActual);
        infoBox.innerHTML = `<strong>Inorden:</strong> Izquierda &rarr; Raíz &rarr; Derecha. Recorre primero el subárbol izquierdo, visita la raíz y luego el subárbol derecho de forma recursiva.`;
        structureTypeLabel.innerText = "Memoria: Pila de Recursión (Call Stack)";
    } else if (recorridoSeleccionado === 'postorder') {
        pasosAnimacion = generarPasosPostorder(arbolActual);
        infoBox.innerHTML = `<strong>Postorden:</strong> Izquierda &rarr; Derecha &rarr; Raíz. Recorre el subárbol izquierdo, luego el subárbol derecho y finalmente visita la raíz del subárbol.`;
        structureTypeLabel.innerText = "Memoria: Pila de Recursión (Call Stack)";
    } else if (recorridoSeleccionado === 'levelorder') {
        pasosAnimacion = generarPasosLevelorder(arbolActual);
        infoBox.innerHTML = `<strong>Por Niveles (BFS):</strong> Nivel por nivel. Explora horizontalmente la estructura empezando de arriba hacia abajo, procesando nodos de izquierda a derecha. Usa una estructura de Cola (FIFO).`;
        structureTypeLabel.innerText = "Memoria: Cola de Procesamiento (FIFO Queue)";
    }

    // Actualizar métricas
    metricHeight.innerText = calcularAltura(arbolActual);
    metricCount.innerText = contarNodos(arbolActual);

    // Actualizar pseudocódigo
    actualizarPseudocodigo();

    actualizarControlesUI();
    limpiarEfectosGraficos();
}

/**
 * Limpia el resaltado CSS en el SVG y los recuadros de resultados de la pantalla.
 */
function limpiarEfectosGraficos() {
    // Quitar clases CSS en SVG
    const nodes = svgTree.querySelectorAll('.node');
    nodes.forEach(n => {
        n.classList.remove('active', 'visited');
    });

    const edges = svgTree.querySelectorAll('.edge');
    edges.forEach(e => {
        e.classList.remove('active', 'visited');
    });

    // Limpiar pseudocódigo
    const pseudoLines = pseudocodeList.querySelectorAll('.pseudo-line');
    pseudoLines.forEach(l => l.classList.remove('pseudo-active'));

    // Limpiar contenedores de monitor
    progressBar.style.width = '0%';
    progressText.innerText = `0 / ${contarNodos(arbolActual)}`;
    consoleOutput.innerHTML = `<span class="console-placeholder">Presiona "Iniciar" o el botón de avanzar para ver la ejecución paso a paso...</span>`;
    sequenceContainer.innerHTML = `<span class="sequence-placeholder">Esperando ejecución...</span>`;
    structureContainer.innerHTML = `<span class="structure-placeholder">Estructura vacía</span>`;
}

/**
 * Actualiza todos los componentes de la vista para reflejar el estado en el paso dado.
 * 
 * @param {number} indicePaso - Posición del paso a cargar en la interfaz
 */
function aplicarEstadoPaso(indicePaso) {
    if (indicePaso < 0 || indicePaso >= pasosAnimacion.length) return;

    const paso = pasosAnimacion[indicePaso];

    // --- 1. RENDERIZADO VISUAL EN EL SVG ---
    const listNodosVisitados = paso.listaNodosVisitados;
    const listAristasVisitadas = paso.listaAristasVisitadas;
    const nodoActivo = paso.idNodoActivo;
    const aristaActiva = paso.idAristaActiva;

    // Actualizar nodos
    const nodes = svgTree.querySelectorAll('.node');
    nodes.forEach(nodeEl => {
        const val = nodeEl.getAttribute('data-valor');
        nodeEl.classList.remove('active', 'visited');

        if (val === nodoActivo) {
            nodeEl.classList.add('active');
        } else if (listNodosVisitados.includes(val)) {
            nodeEl.classList.add('visited');
        }
    });

    // Actualizar aristas
    const edges = svgTree.querySelectorAll('.edge');
    edges.forEach(edgeEl => {
        const id = edgeEl.getAttribute('id');
        edgeEl.classList.remove('active', 'visited');

        if (id === `edge-${aristaActiva}`) {
            edgeEl.classList.add('active');
        } else if (listAristasVisitadas.includes(id)) {
            edgeEl.classList.add('visited');
        }
    });

    // --- 2. ACTUALIZAR PANEL DE RESULTADOS Y PROGRESO ---
    const totalNodos = contarNodos(arbolActual);
    const visitadosCount = listNodosVisitados.length;
    const porcProgreso = (visitadosCount / totalNodos) * 100;
    progressBar.style.width = `${porcProgreso}%`;
    progressText.innerText = `${visitadosCount} / ${totalNodos}`;

    // Consola explicativa
    consoleOutput.innerHTML = `<span>${paso.mensajeExplicativo}</span>`;

    // Secuencia de salida (Píldoras)
    sequenceContainer.innerHTML = '';
    listNodosVisitados.forEach((valor, i) => {
        const pill = document.createElement('span');
        pill.className = 'node-pill';
        pill.innerText = valor;
        sequenceContainer.appendChild(pill);

        if (i < listNodosVisitados.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'node-arrow';
            arrow.innerHTML = ' &rarr; ';
            sequenceContainer.appendChild(arrow);
        }
    });

    // --- 3. MOSTRAR EL ESTADO DE MEMORIA INTERNA (PILA/COLA) ---
    structureContainer.innerHTML = '';
    const memValues = paso.estadoMemoria;

    if (memValues.length === 0) {
        structureContainer.innerHTML = `<span class="structure-placeholder">Memoria vacía</span>`;
    } else {
        memValues.forEach((valor, i) => {
            const item = document.createElement('div');
            item.className = 'struct-item';
            item.innerText = valor;

            // Resaltar el elemento que está arriba/al frente de la memoria
            // En la pila (DFS) es el último elemento añadido. En la cola (BFS) es el primer elemento.
            const esActivo = (recorridoSeleccionado === 'levelorder') ? (i === 0) : (i === memValues.length - 1);
            if (esActivo) {
                item.classList.add('struct-active');
            }
            structureContainer.appendChild(item);

            if (i < memValues.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'struct-arrow';
                // Flecha a la derecha para Cola, o pleita para Pila
                arrow.innerHTML = (recorridoSeleccionado === 'levelorder') ? ' &larr; ' : ' | ';
                structureContainer.appendChild(arrow);
            }
        });
    }

    // --- 4. ACTUALIZAR ILUMINACIÓN DE PSEUDOCÓDIGO ---
    const pseudoLines = pseudocodeList.querySelectorAll('.pseudo-line');
    pseudoLines.forEach((li, idx) => {
        if (idx === paso.lineaPseudo) {
            li.classList.add('pseudo-active');
        } else {
            li.classList.remove('pseudo-active');
        }
    });

    // --- 5. RETROALIMENTACIÓN DE AUDIO ---
    reproducirPitido(paso.frecuenciaSonido);

    // --- 6. LANZAR CONFETI AL FINALIZAR ---
    if (indicePaso === pasosAnimacion.length - 1) {
        lanzarConfetiEnNodo(paso.idNodoActivo);
    }

    actualizarControlesUI();
}

function actualizarControlesUI() {
    // Deshabilitar tabs si la animación corre para no romper el estado
    traversalTabs.forEach(tab => {
        tab.disabled = enReproduccion;
    });

    // Botones de reproducción
    btnPrev.disabled = (indicePasoActual <= 0 || enReproduccion);
    btnNext.disabled = (indicePasoActual >= pasosAnimacion.length - 1 || enReproduccion);

    // Iconos de play/pause
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    if (enReproduccion) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        btnPlay.setAttribute('title', 'Pausar Recorrido');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        btnPlay.setAttribute('title', 'Iniciar Recorrido');
    }
}

// --- CLASIFICACIÓN ESTRUCTURAL Y TOOLTIPS ---

/**
 * Busca un nodo y su padre directo en base al valor especificado.
 */
function buscarNodoYPadre(raiz, valor, padre = null) {
    if (!raiz) return null;
    if (raiz.valor === valor) return { nodo: raiz, padre: padre };

    const izq = buscarNodoYPadre(raiz.izquierda, valor, raiz);
    if (izq) return izq;

    return buscarNodoYPadre(raiz.derecha, valor, raiz);
}

/**
 * Determina los roles estructurales (Raíz, Padre, Hijo, Hoja) de un nodo dado.
 */
function clasificarNodoEstructural(raiz, valor) {
    const resultado = buscarNodoYPadre(raiz, valor);
    if (!resultado) return "Nodo desconocido";

    const { nodo, padre } = resultado;
    const esRaiz = (padre === null);
    const esPadre = (nodo.izquierda !== null || nodo.derecha !== null);
    const esHijo = (padre !== null);
    const esHoja = (nodo.izquierda === null && nodo.derecha === null);

    const roles = [];
    if (esRaiz) roles.push("Raíz");
    if (esPadre) roles.push("Padre");
    if (esHijo) roles.push("Hijo");
    if (esHoja) roles.push("Hoja");

    return roles.join(" e ");
}

// --- SISTEMA DE CONFETI NATIVO ---
/**
 * Lanza una explosión de confeti de colores desde la burbuja de un nodo en el navegador.
 */
function lanzarConfetiEnNodo(nodoId, idPrefijo = "") {
    const nodeEl = document.getElementById(`${idPrefijo}node-${nodoId}`);
    if (!nodeEl) return;

    const rect = nodeEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + window.scrollX;
    const y = rect.top + rect.height / 2 + window.scrollY;

    const colores = ['#58a6ff', '#39d353', '#ffea79', '#ff7b72', '#bc8cff', '#56d4dd'];

    for (let i = 0; i < 28; i++) {
        const particle = document.createElement('div');
        particle.className = 'confeti-particle';

        const tamano = Math.floor(Math.random() * 6) + 6; // Entre 6px y 12px
        particle.style.width = `${tamano}px`;
        particle.style.height = `${tamano}px`;
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        particle.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];

        // Iniciar en las coordenadas del nodo
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Generar vector aleatorio para la explosión
        const angulo = Math.random() * 2 * Math.PI;
        const fuerza = Math.random() * 110 + 40;
        const dx = Math.cos(angulo) * fuerza;
        const dy = Math.sin(angulo) * fuerza - Math.random() * 40; // Sesgo hacia arriba (gravedad)
        const rotacion = Math.floor(Math.random() * 360) + 180;

        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.setProperty('--rot', `${rotacion}deg`);

        document.body.appendChild(particle);

        // Limpiar del DOM al finalizar
        setTimeout(() => particle.remove(), 1200);
    }
}

// --- MANEJO DEL REPRODUCTOR (MOTOR DE ANIMACIÓN) ---

/**
 * Inicia o reanuda la simulación paso a paso de forma continua.
 */
function iniciarReproduccion() {
    if (pasosAnimacion.length === 0) return;

    enReproduccion = true;
    actualizarControlesUI();

    // Si ya completamos el recorrido, reiniciar al inicio
    if (indicePasoActual >= pasosAnimacion.length - 1) {
        indicePasoActual = -1;
        limpiarEfectosGraficos();
    }

    cicloAnimacion();
}

/**
 * Detiene temporalmente la reproducción automática sin borrar el progreso.
 */
function pararReproduccion() {
    enReproduccion = false;
    if (temporizadorAnimacion) {
        clearTimeout(temporizadorAnimacion);
        temporizadorAnimacion = null;
    }
    actualizarControlesUI();
}

/**
 * Función cíclica recursiva (bucle) que ejecuta un paso y programa el siguiente.
 * La velocidad se toma directamente en tiempo real del slider en milisegundos.
 */
function cicloAnimacion() {
    if (!enReproduccion) return;

    indicePasoActual++;
    aplicarEstadoPaso(indicePasoActual);

    if (indicePasoActual < pasosAnimacion.length - 1) {
        // Invertimos la escala: a mayor valor en el slider (derecha), menor retraso en milisegundos (más rápido)
        const retrasoMs = 2500 - parseInt(speedSlider.value);
        temporizadorAnimacion = setTimeout(cicloAnimacion, retrasoMs);
    } else {
        enReproduccion = false;
        actualizarControlesUI();
    }
}

// --- FUNCIONES AUXILIARES DE UTILIDAD ---

/**
 * Cuenta recursivamente el número total de nodos de un árbol binario.
 */
function contarNodos(nodo) {
    if (!nodo) return 0;
    return 1 + contarNodos(nodo.izquierda) + contarNodos(nodo.derecha);
}

/**
 * Carga un árbol predefinido en memoria, recalcula su tamaño en pantalla y lo renderiza.
 * 
 * @param {string} letraPreset - Indica si se carga 'A' o 'B'
 */
function calcularSeparacionInicial(raiz) {
    const altura = calcularAltura(raiz);
    const cantidad = contarNodos(raiz);
    return Math.max(170, Math.min(320, 360 - (altura * 28) - (cantidad * 5)));
}

function cargarArbolPreset(letraPreset) {
    if (letraPreset === 'A') {
        arbolActual = crearArbolA();
        calcularPosiciones(arbolActual, 450, 60, 0, calcularSeparacionInicial(arbolActual));
        nombreArbolActual = 'A';
    } else {
        arbolActual = crearArbolB();
        calcularPosiciones(arbolActual, 450, 60, 0, calcularSeparacionInicial(arbolActual));
        nombreArbolActual = 'B';
    }

    viewportOffset = { x: 0, y: 0 };
    renderizarArbol(arbolActual);
    aplicarTransformViewport();
    inicializarRecorrido();
}

// --- INTERACTIVIDAD CON LA TEORÍA (HIGHLIGHTS) ---
/**
 * Clasifica nodos y devuelve un arreglo de letras de nodos que cumplen el criterio teórico.
 * 
 * @param {string} tipoHighlight - 'all', 'root', 'parent', 'child', 'leaf'
 */
function obtenerNodosPorCategoria(tipoHighlight) {
    const listado = [];

    function clasificar(nodo, esRaiz = false) {
        if (!nodo) return;

        let coincide = false;

        switch (tipoHighlight) {
            case 'all':
                coincide = true;
                break;
            case 'root':
                coincide = esRaiz;
                break;
            case 'parent':
                coincide = (nodo.izquierda || nodo.derecha) !== null;
                break;
            case 'child':
                coincide = !esRaiz;
                break;
            case 'leaf':
                coincide = (!nodo.izquierda && !nodo.derecha);
                break;
        }

        if (coincide) listado.push(nodo.valor);

        clasificar(nodo.izquierda, false);
        clasificar(nodo.derecha, false);
    }

    clasificar(arbolActual, true);
    return listado;
}

/**
 * Limpia los resaltados visuales aplicados sobre los nodos del árbol.
 */
function limpiarResaltadosTeoria() {
    const nodes = svgTree ? svgTree.querySelectorAll('.node') : [];
    nodes.forEach(nodeEl => {
        nodeEl.classList.remove(
            'highlighted',
            'highlight-all',
            'highlight-root',
            'highlight-parent',
            'highlight-child',
            'highlight-leaf'
        );
    });
}

/**
 * Aplica un resaltado visual a los nodos del árbol según la categoría teórica.
 *
 * @param {string} categoria - 'all', 'root', 'parent', 'child' o 'leaf'
 */
function aplicarResaltadoTeoria(categoria) {
    limpiarResaltadosTeoria();

    if (!arbolActual) return;

    const letrasNodos = obtenerNodosPorCategoria(categoria);
    letrasNodos.forEach(valor => {
        const nodeEl = document.getElementById(`node-${valor}`);
        if (nodeEl) {
            nodeEl.classList.add('highlighted', `highlight-${categoria}`);
        }
    });
}

/**
 * Vincula los eventos de hover de las tarjetas de teoría para resaltar
 * los nodos del SVG de forma consistente.
 */
function configurarHoverTeoria() {
    const cards = document.querySelectorAll('.theory-card');

    if (!cards.length) return;

    cards.forEach(card => {
        if (card.dataset.hoverBound === 'true') return;
        card.dataset.hoverBound = 'true';

        const activarResaltado = () => {
            if (enReproduccion) return;
            aplicarResaltadoTeoria(card.getAttribute('data-highlight') || 'all');
        };

        const limpiarResaltado = () => {
            limpiarResaltadosTeoria();
        };

        card.addEventListener('mouseenter', activarResaltado);
        card.addEventListener('mouseover', activarResaltado);
        card.addEventListener('focusin', activarResaltado);
        card.addEventListener('mouseleave', limpiarResaltado);
        card.addEventListener('mouseout', limpiarResaltado);
        card.addEventListener('focusout', limpiarResaltado);
    });
}

// --- CONFIGURACIÓN DE TEMA CLARO / OSCURO ---
/**
 * Alterna el tema de color en toda la página mediante una clase en el body.
 */
function alternarTema() {
    preferenciaTema = (preferenciaTema === 'dark') ? 'light' : 'dark';

    if (preferenciaTema === 'light') {
        document.body.classList.add('light-theme');
        themeDarkIcon.classList.add('hidden');
        themeLightIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('light-theme');
        themeDarkIcon.classList.remove('hidden');
        themeLightIcon.classList.add('hidden');
    }
}

// --- COPIAR SECUENCIA AL PORTAPAPELES ---
/**
 * Copia la secuencia de nodos visitados en el portapapeles del cliente con formato formal.
 */
function copiarResultadoAlPortapapeles(pasos, tipoRecorrido, btnId, textId) {
    if (!pasos || pasos.length === 0) return;

    // Recuperamos la secuencia total del último paso calculado en la simulación
    const secuenciaCompleta = pasos[pasos.length - 1].listaNodosVisitados;
    if (secuenciaCompleta.length === 0) return;

    // Formatear el título del recorrido (ej: preorder -> Preorden)
    let nombreRecorrido = "Preorden";
    if (tipoRecorrido === 'preorder') nombreRecorrido = "Preorden";
    else if (tipoRecorrido === 'inorder') nombreRecorrido = "Inorden";
    else if (tipoRecorrido === 'postorder') nombreRecorrido = "Postorden";
    else if (tipoRecorrido === 'levelorder') nombreRecorrido = "Por niveles";

    const textoCopiado = `${nombreRecorrido}: ${secuenciaCompleta.join(' → ')}`;

    navigator.clipboard.writeText(textoCopiado).then(() => {
        const btn = document.getElementById(btnId);
        const txt = document.getElementById(textId);
        const textoOriginal = txt.innerText;

        btn.classList.add('copied');
        txt.innerText = "¡Copiado!";

        // Quitar estado de confirmación visual después de 1.5s
        setTimeout(() => {
            btn.classList.remove('copied');
            txt.innerText = textoOriginal;
        }, 1500);
    }).catch(err => {
        console.error("Fallo al copiar al portapapeles:", err);
    });
}

// --- DELEGACIÓN DE EVENTOS DE TOOLTIP ---
/**
 * Vincula mediante delegación de eventos el cálculo de tooltips sobre nodos en cualquier lienzo SVG.
 */
function configurarDelegacionTooltips(svgElement, obtenerRaizFn) {
    svgElement.addEventListener('mouseover', (e) => {
        const gNode = e.target.closest('.node');
        if (gNode) {
            const valor = gNode.getAttribute('data-valor');
            const raiz = obtenerRaizFn();

            // Consultar roles estructurales reales
            const clasificacion = clasificarNodoEstructural(raiz, valor);

            nodeTooltip.innerHTML = `<strong>Nodo ${valor}</strong><br>${clasificacion}`;
            nodeTooltip.classList.add('visible');
        }
    });

    svgElement.addEventListener('mousemove', (e) => {
        const gNode = e.target.closest('.node');
        if (gNode) {
            // Posicionar tooltip sutilmente al lado derecho e inferior del cursor del mouse
            nodeTooltip.style.left = `${e.pageX + 15}px`;
            nodeTooltip.style.top = `${e.pageY + 15}px`;
        }
    });

    svgElement.addEventListener('mouseout', (e) => {
        const gNode = e.target.closest('.node');
        if (gNode) {
            nodeTooltip.classList.remove('visible');
        }
    });
}

// ============================================================
// --- CONSTRUCTOR DE ÁRBOLES BST ---
// ============================================================

/** Estado del constructor de árboles personalizado */
let arbolConstructor = null;       // Raíz del árbol que se está construyendo
let nodosInsertados = [];          // Array de valores ya insertados

const builderSvg = document.getElementById('builder-tree-svg');
const builderEdgesGroup = document.getElementById('builder-edges-group');
const builderNodesGroup = document.getElementById('builder-nodes-group');
const builderEmptyMsg = document.getElementById('builder-empty-msg');
const builderNodeInput = document.getElementById('builder-node-input');
const builderMsg = document.getElementById('builder-msg');
const builderNodeCount = document.getElementById('builder-node-count');
const builderNodesDisplay = document.getElementById('builder-nodes-display');
const builderPanel = document.getElementById('tree-builder-panel');
const builderDescText = document.getElementById('builder-desc-text');
const builderTypeButtons = document.querySelectorAll('.type-btn');

function compararValores(a, b, tipo = tipoNodoBuilder) {
    const textoA = String(a).toUpperCase();
    const textoB = String(b).toUpperCase();

    if (tipo === 'letter') {
        return textoA.localeCompare(textoB, undefined, { sensitivity: 'base' });
    }

    return Number(textoA) - Number(textoB);
}

/**
 * Inserta un valor en el árbol BST del constructor.
 * Mantiene la propiedad BST: izq < raíz < der. Funciona con números o letras.
 */
function insertarEnBST(raiz, valor, tipo = tipoNodoBuilder) {
    if (!raiz) {
        return new NodoArbol(String(valor));
    }

    const valorTexto = String(valor).toUpperCase();
    const valorRaiz = String(raiz.valor).toUpperCase();

    if (tipo === 'letter') {
        if (valorTexto < valorRaiz) {
            raiz.izquierda = insertarEnBST(raiz.izquierda, valor, tipo);
        } else if (valorTexto > valorRaiz) {
            raiz.derecha = insertarEnBST(raiz.derecha, valor, tipo);
        }
    } else {
        const valNum = Number(valorTexto);
        const valRaiz = Number(valorRaiz);
        if (valNum < valRaiz) {
            raiz.izquierda = insertarEnBST(raiz.izquierda, valor, tipo);
        } else if (valNum > valRaiz) {
            raiz.derecha = insertarEnBST(raiz.derecha, valor, tipo);
        }
    }

    // Si es igual, no se inserta (BST sin duplicados)
    return raiz;
}

/**
 * Muestra un mensaje de feedback en el constructor.
 */
function mostrarMensajeBuilder(texto, tipo = 'info') {
    builderMsg.textContent = texto;
    builderMsg.className = `builder-msg builder-msg--${tipo}`;
    setTimeout(() => {
        builderMsg.textContent = '';
        builderMsg.className = 'builder-msg';
    }, 3000);
}

function actualizarTipoBuilder(tipo) {
    tipoNodoBuilder = tipo === 'letter' ? 'letter' : 'number';

    builderTypeButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-type') === tipoNodoBuilder;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const esLetra = tipoNodoBuilder === 'letter';
    builderDescText.textContent = esLetra
        ? 'Ingresa una letra (A–Z) para insertarla en el BST. Se ordenará automáticamente.'
        : 'Ingresa un número (1–999) para insertarlo en el BST. Se ordenará automáticamente.';

    builderNodeInput.setAttribute('inputmode', esLetra ? 'text' : 'numeric');
    builderNodeInput.setAttribute('placeholder', esLetra ? 'Ej: M' : 'Ej: 42');
    builderNodeInput.value = '';
    builderNodeInput.focus();
}

/**
 * Actualiza la lista visual de nodos insertados en el constructor.
 */
function actualizarListaNodosBuilder() {
    builderNodesDisplay.innerHTML = '';
    builderNodeCount.textContent = nodosInsertados.length;

    if (nodosInsertados.length === 0) {
        builderNodesDisplay.innerHTML = '<span class="builder-placeholder">Aún no hay nodos. Inserta uno arriba.</span>';
        return;
    }

    const sorted = [...nodosInsertados].sort((a, b) => compararValores(a, b, tipoNodoBuilder));
    sorted.forEach(val => {
        const pill = document.createElement('span');
        pill.className = 'builder-node-pill';
        pill.textContent = val;
        builderNodesDisplay.appendChild(pill);
    });
}

/**
 * Recalcula posiciones y re-renderiza el árbol en la vista previa del constructor.
 */
function actualizarPreviewBuilder() {
    if (!arbolConstructor) {
        builderEdgesGroup.innerHTML = '';
        builderNodesGroup.innerHTML = '';
        if (builderEmptyMsg) builderEmptyMsg.style.display = 'block';
        return;
    }

    if (builderEmptyMsg) builderEmptyMsg.style.display = 'none';

    const separacion = calcularSeparacionInicial(arbolConstructor);
    calcularPosiciones(arbolConstructor, 350, 50, 0, separacion);
    renderizarArbol(arbolConstructor, builderEdgesGroup, builderNodesGroup, 'b-');
}

/**
 * Genera un árbol BST aleatorio con entre 7 y 12 nodos únicos.
 * Usa valores del 1 al 99 para que el árbol sea legible.
 */
function generarArbolAleatorio(minNodos = 7, maxNodos = 12, tipo = tipoNodoBuilder) {
    const cantidad = Math.floor(Math.random() * (maxNodos - minNodos + 1)) + minNodos;
    const valores = new Set();

    while (valores.size < cantidad) {
        if (tipo === 'letter') {
            const letra = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            valores.add(letra);
        } else {
            valores.add(Math.floor(Math.random() * 99) + 1);
        }
    }

    arbolConstructor = null;
    nodosInsertados = [];

    valores.forEach(val => {
        arbolConstructor = insertarEnBST(arbolConstructor, val, tipo);
        nodosInsertados.push(val);
    });

    actualizarListaNodosBuilder();
    actualizarPreviewBuilder();
    mostrarMensajeBuilder(`✓ Árbol aleatorio generado con ${cantidad} nodos.`, 'success');
}

/**
 * Carga el árbol del constructor en el simulador principal y cierra el panel.
 */
function aplicarArbolDelConstructor() {
    if (!arbolConstructor) {
        mostrarMensajeBuilder('⚠ Primero construye un árbol.', 'warning');
        return;
    }

    pararReproduccion();
    arbolActual = arbolConstructor;
    nombreArbolActual = 'custom';
    viewportOffset = { x: 0, y: 0 };

    const separacion = calcularSeparacionInicial(arbolActual);
    calcularPosiciones(arbolActual, 450, 55, 0, separacion);
    renderizarArbol(arbolActual);
    aplicarTransformViewport();
    inicializarRecorrido();
    configurarHoverTeoria();

    builderPanel.style.display = 'none';
    mostrarMensajeBuilder('', '');
}

/**
 * Genera un árbol aleatorio directamente en el simulador principal (sin abrir el constructor).
 */
function aplicarTransformViewport() {
    if (svgViewport) {
        svgViewport.setAttribute('transform', `translate(${viewportOffset.x}, ${viewportOffset.y})`);
    }
}

function generarYCargarArbolAleatorio(tipo = 'number') {
    if (enReproduccion) return;

    const cantidad = Math.floor(Math.random() * 6) + 7; // 7 a 12 nodos
    const valores = new Set();
    while (valores.size < cantidad) {
        if (tipo === 'letter') {
            valores.add(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        } else {
            valores.add(Math.floor(Math.random() * 99) + 1);
        }
    }

    let raiz = null;
    valores.forEach(val => {
        raiz = insertarEnBST(raiz, val, tipo);
    });

    pararReproduccion();
    arbolActual = raiz;
    nombreArbolActual = tipo === 'letter' ? 'random-letter' : 'random-number';
    viewportOffset = { x: 0, y: 0 };

    const separacion = calcularSeparacionInicial(arbolActual);
    calcularPosiciones(arbolActual, 450, 55, 0, separacion);
    renderizarArbol(arbolActual);
    aplicarTransformViewport();
    inicializarRecorrido();
    configurarHoverTeoria();
    configurarDelegacionTooltips(svgTree, () => arbolActual);
}

// ============================================================
// --- REGISTRO DE EVENTOS (EVENT LISTENERS) ---
// ============================================================

// Botón de Play/Pausa
btnPlay.addEventListener('click', () => {
    if (enReproduccion) pararReproduccion();
    else iniciarReproduccion();
});

// Botón Paso Anterior
btnPrev.addEventListener('click', () => {
    if (indicePasoActual > 0) {
        indicePasoActual--;
        aplicarEstadoPaso(indicePasoActual);
    } else if (indicePasoActual === 0) {
        indicePasoActual = -1;
        limpiarEfectosGraficos();
        actualizarControlesUI();
    }
});

// Botón Paso Siguiente
btnNext.addEventListener('click', () => {
    if (indicePasoActual < pasosAnimacion.length - 1) {
        indicePasoActual++;
        aplicarEstadoPaso(indicePasoActual);
    }
});

// Botón de Reiniciar
btnReset.addEventListener('click', () => {
    pararReproduccion();
    indicePasoActual = -1;
    limpiarEfectosGraficos();
    actualizarControlesUI();
});

// Botón para alternar el modo mover pizarra
btnPanMode.addEventListener('click', () => {
    panModeEnabled = !panModeEnabled;
    btnPanMode.classList.toggle('active', panModeEnabled);
    btnPanMode.setAttribute('aria-pressed', panModeEnabled ? 'true' : 'false');
    svgContainer.classList.toggle('pan-mode', panModeEnabled);
    svgContainer.classList.remove('is-panning');
    if (!panModeEnabled) {
        panState.active = false;
    }
});

if (svgContainer) {
    svgContainer.addEventListener('mousedown', (event) => {
        if (!panModeEnabled) return;
        if (event.button !== 0) return;

        isPanning = true;
        panState.active = true;
        panState.startX = event.clientX;
        panState.startY = event.clientY;
        panState.offsetX = viewportOffset.x;
        panState.offsetY = viewportOffset.y;
        svgContainer.classList.add('is-panning');
    });

    window.addEventListener('mousemove', (event) => {
        if (!panModeEnabled || !panState.active) return;
        const deltaX = event.clientX - panState.startX;
        const deltaY = event.clientY - panState.startY;
        viewportOffset.x = panState.offsetX + deltaX;
        viewportOffset.y = panState.offsetY + deltaY;
        aplicarTransformViewport();
    });

    window.addEventListener('mouseup', () => {
        if (!panState.active) return;
        isPanning = false;
        panState.active = false;
        svgContainer.classList.remove('is-panning');
    });
}

// Botón de sonido
btnSound.addEventListener('click', () => {
    audioHabilitado = !audioHabilitado;
    if (audioHabilitado) {
        soundOnIcon.classList.remove('hidden');
        soundOffIcon.classList.add('hidden');
        btnSound.classList.add('active');
        reproducirPitido(587.33, 100);
    } else {
        soundOnIcon.classList.add('hidden');
        soundOffIcon.classList.remove('hidden');
        btnSound.classList.remove('active');
    }
});

// Selección de recorrido principal (Tabs)
traversalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (enReproduccion) return;

        // Limpiar estilos activos locales
        const parent = tab.parentElement;
        parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');

        recorridoSeleccionado = tab.getAttribute('data-traversal');
        inicializarRecorrido();
    });
});

// Copiar secuencia principal
btnCopyResult.addEventListener('click', () => {
    copiarResultadoAlPortapapeles(pasosAnimacion, recorridoSeleccionado, 'btn-copy-result', 'btn-copy-text');
});

// Botón de Tema (Cabecera)
btnTheme.addEventListener('click', alternarTema);

// --- BOTONES DEL CONSTRUCTOR ---

// Abrir panel constructor
document.getElementById('btn-open-builder').addEventListener('click', () => {
    builderPanel.style.display = 'block';
    builderPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Cerrar panel constructor
document.getElementById('btn-close-builder').addEventListener('click', () => {
    builderPanel.style.display = 'none';
});

// Insertar nodo en el BST del constructor
document.getElementById('btn-builder-insert').addEventListener('click', () => {
    const rawVal = builderNodeInput.value.trim();

    if (rawVal === '') {
        mostrarMensajeBuilder(tipoNodoBuilder === 'letter' ? '⚠ Ingresa una letra válida (A–Z).' : '⚠ Ingresa un número válido.', 'warning');
        return;
    }

    if (tipoNodoBuilder === 'letter') {
        const val = rawVal.toUpperCase();
        if (!/^[A-Z]$/.test(val)) {
            mostrarMensajeBuilder('⚠ Ingresa una sola letra de la A a la Z.', 'warning');
            return;
        }
        if (nodosInsertados.includes(val)) {
            mostrarMensajeBuilder(`⚠ La letra ${val} ya existe en el árbol (BST sin duplicados).`, 'warning');
            return;
        }
        if (nodosInsertados.length >= 15) {
            mostrarMensajeBuilder('⚠ Máximo de 15 nodos alcanzado para una buena visualización.', 'warning');
            return;
        }

        arbolConstructor = insertarEnBST(arbolConstructor, val, 'letter');
        nodosInsertados.push(val);

        actualizarListaNodosBuilder();
        actualizarPreviewBuilder();
        mostrarMensajeBuilder(`✓ Letra ${val} insertada correctamente.`, 'success');
    } else {
        const val = Number(rawVal);
        if (!Number.isInteger(val) || val < 1 || val > 999) {
            mostrarMensajeBuilder('⚠ El valor debe estar entre 1 y 999.', 'warning');
            return;
        }
        if (nodosInsertados.includes(val)) {
            mostrarMensajeBuilder(`⚠ El valor ${val} ya existe en el árbol (BST sin duplicados).`, 'warning');
            return;
        }
        if (nodosInsertados.length >= 15) {
            mostrarMensajeBuilder('⚠ Máximo de 15 nodos alcanzado para una buena visualización.', 'warning');
            return;
        }

        arbolConstructor = insertarEnBST(arbolConstructor, val, 'number');
        nodosInsertados.push(val);

        actualizarListaNodosBuilder();
        actualizarPreviewBuilder();
        mostrarMensajeBuilder(`✓ Nodo ${val} insertado correctamente.`, 'success');
    }

    builderNodeInput.value = '';
    builderNodeInput.focus();
});

// Permitir insertar con Enter
builderNodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btn-builder-insert').click();
    }
});

// Generar árbol aleatorio en el constructor
document.getElementById('btn-builder-random').addEventListener('click', () => {
    generarArbolAleatorio();
});

// Limpiar árbol del constructor
document.getElementById('btn-builder-clear').addEventListener('click', () => {
    arbolConstructor = null;
    nodosInsertados = [];
    actualizarListaNodosBuilder();
    actualizarPreviewBuilder();
    if (builderEmptyMsg) builderEmptyMsg.style.display = 'block';
    mostrarMensajeBuilder('Árbol limpiado.', 'info');
});

// Usar árbol del constructor en el simulador
document.getElementById('btn-builder-apply').addEventListener('click', () => {
    aplicarArbolDelConstructor();
});

// Generar árbol aleatorio con letras desde el panel principal
document.getElementById('btn-random-letters').addEventListener('click', () => {
    generarYCargarArbolAleatorio('letter');
});

// Generar árbol aleatorio con números desde el panel principal
document.getElementById('btn-random-numbers').addEventListener('click', () => {
    generarYCargarArbolAleatorio('number');
});

// Cambiar el tipo de nodo del constructor (número o letra)
builderTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        actualizarTipoBuilder(btn.getAttribute('data-type'));
    });
});

// --- INICIALIZACIÓN GENERAL AL CARGAR ---
window.addEventListener('DOMContentLoaded', () => {
    actualizarTipoBuilder(tipoNodoBuilder);

    cargarArbolPreset('A');

    configurarHoverTeoria();
    configurarDelegacionTooltips(svgTree, () => arbolActual);

    if (builderSvg) {
        configurarDelegacionTooltips(builderSvg, () => arbolConstructor);
    }
});

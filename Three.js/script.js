// Variables globales para Three.js
let scene, camera, renderer;
let gap = 1;
let controls;

// Dimensiones de la gráfica
const graphWidth = 10;
const graphHeight = 15;
const graphDepth = 20;

// Escalas globales
let xScale, yScale, zScale;

// Elemento de tooltip
const tooltipText = document.createElement("div");
tooltipText.classList.add("tooltip");
tooltipText.style.display = "none"; // Inicialmente oculto
tooltipText.style.opacity = "0";
document.body.appendChild(tooltipText);


// Función de inicio
function init() {
  // Crear la escena
  scene = new THREE.Scene();

  // Crear la cámara isométrica
  const aspectRatio = window.innerWidth / window.innerHeight;
  const viewSize = 40; // Ajustar el tamaño de la vista según tus preferencias
  const cameraDistance = 50;
  camera = new THREE.OrthographicCamera(
    viewSize * aspectRatio / -2,
    viewSize * aspectRatio / 2,
    viewSize / 2,
    viewSize / -2,
    1,
    1000
  );
  camera.position.set(cameraDistance, cameraDistance, cameraDistance);
  camera.lookAt(scene.position);

  // Crear el renderizador
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
    

  // Cargar los datos y dibujar los rectángulos en 3D
  loadJSONData();
}

// Cargar los datos desde el archivo JSON
function loadJSONData() {
  const url =
    'https://raw.githubusercontent.com/Ainhoa1409/Logistica_puerto/main/mydatabase.mycollection.json';
  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Carga correcta de datos');
      console.log(data);
      drawRectangles(data, 'Terminal C  Area 1');
      drawAxes(); // Agregar ejes de coordenadas
      animate();
    })
    .catch(error => {
      console.error('Error al cargar los datos:', error);
    });
}

// Función para dibujar los rectángulos en 3D
function drawRectangles(data, ubicacion) {
  // Definir escalas para mapear las coordenadas a posiciones en la escena 3D
  xScale = d3
    .scaleLinear()
    .domain([0, 4])
    .range([0, graphWidth - 3]);
  yScale = d3
    .scaleLinear()
    .domain([0, 7])
    .range([0, graphHeight / 2]);
  zScale = d3
    .scaleLinear()
    .domain([0, 18])
    .range([0, graphDepth + 5]);

  // Filtrar los datos para obtener solo aquellos que pertenezcan al área especificada
  const filteredData = data.filter(d => d.Ubicacion === ubicacion);

  // Crear material y geometría para las líneas
  const linesMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc }); // Color claro para las líneas
  const linesGeometry = new THREE.Geometry();

  // Dibujar líneas verticales del dominio x
  for (let i = 0; i <= graphWidth / gap; i += (graphWidth / gap) / 4) {
    const x = xScale(i * gap) + gap / 2 - 0.45;
    linesGeometry.vertices.push(new THREE.Vector3(x, 0, 0));
    linesGeometry.vertices.push(new THREE.Vector3(x, graphHeight + 1, 0));
    linesGeometry.vertices.push(new THREE.Vector3(x, 0, 0));
    linesGeometry.vertices.push(new THREE.Vector3(x, 0, graphDepth + 8));
  }

  // Dibujar líneas horizontales del dominio y
  for (let j = 0; j <= graphHeight / gap; j += (graphHeight / gap) / 7) {
    const y = yScale(j * gap) + gap / 2 - 0.45;
    linesGeometry.vertices.push(new THREE.Vector3(0, y, 0));
    linesGeometry.vertices.push(new THREE.Vector3(graphWidth + 10, y, 0));
    linesGeometry.vertices.push(new THREE.Vector3(0, y, 0));
    linesGeometry.vertices.push(new THREE.Vector3(0, y, graphDepth + 8));
  }

  // Dibujar líneas entre capas del dominio z
  for (let k = 0; k <= graphDepth / gap; k += (graphDepth / gap) / 18) {
    const z = zScale(k * gap) + gap / 2 - 0.45;
    linesGeometry.vertices.push(new THREE.Vector3(0, 0, z));
    linesGeometry.vertices.push(new THREE.Vector3(graphWidth + 10, 0, z));
    linesGeometry.vertices.push(new THREE.Vector3(0, 0, z));
    linesGeometry.vertices.push(new THREE.Vector3(0, graphHeight + 1, z));
  }

  const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(lines);

// Crear los rectángulos en 3D
filteredData.forEach((d, index) => {
  const geometry = new THREE.BoxGeometry(2, 0.9, 0.9);
  
  // Obtener la altura del contenedor actual y el contenedor debajo
  const currentAltura = parseInt(d.Altura);
  const belowAltura = currentAltura - 1;
  
  // Verificar si el peso es mayor al contenedor debajo
  const isWeightGreater = d.Peso > filteredData[index - 1]?.Peso;
  
  // Definir el color del material según la condición
  const color = isWeightGreater ? 0xff0000 : 0x00ff00;
  
  // Crear material para el rectángulo
  const material = new THREE.MeshBasicMaterial({ color });
  
  // Crear material para los bordes del rectángulo
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

  const rectangle = new THREE.Mesh(geometry, material);
  rectangle.position.set(
    xScale(parseInt(d.Pila)),
    yScale(parseInt(d.Altura)),
    zScale(parseInt(d.Bahia))
  );
  scene.add(rectangle);

  // Crear los bordes del rectángulo
  const edges = new THREE.EdgesGeometry(geometry);
  const border = new THREE.LineSegments(edges, edgesMaterial);
  rectangle.add(border);
    
 const domEvents = new THREEx.DomEvents(camera, renderer.domElement);
 
 // Evento de escucha para cuando el mouse está encima del rectángulo
    domEvents.addEventListener(rectangle, 'mouseover', event => {
  // Obtener las coordenadas en el espacio del lienzo
  const canvasPosition = new THREE.Vector3();
  canvasPosition.setFromMatrixPosition(rectangle.matrixWorld);
  canvasPosition.project(camera);

  // Convertir las coordenadas del lienzo a las coordenadas de la ventana
  const windowX = Math.round((canvasPosition.x + 1) * window.innerWidth / 2);
  const windowY = Math.round((-canvasPosition.y + 1) * window.innerHeight / 2);

  // Mostrar el tooltip y establecer su contenido
  tooltipText.style.display = 'block';
  tooltipText.style.opacity = '1';
  tooltipText.innerHTML = `Rectángulo (${d.ID_Container}, ${d.PuertoDestino}, ${d.Bahia})`;
  tooltipText.style.left = windowX + 20 + 'px';
  tooltipText.style.top = windowY - 20 + 'px';
});


        // Evento de escucha para cuando el mouse deja el rectángulo
        domEvents.addEventListener(rectangle,'mouseout', event => {
            // Ocultar el tooltip
            tooltipText.style.display = 'none';
            tooltipText.style.opacity = '0.3s';
        });
    
});

  // Crear el punto (0, 0, 0) en la gráfica
  const pointGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const originPoint = new THREE.Mesh(pointGeometry, pointMaterial);
  scene.add(originPoint);
}

// Función para dibujar los ejes de coordenadas
function drawAxes() {
  const axisLength = 1.2 * Math.max(graphWidth * gap, graphHeight * gap, graphDepth * gap);

  const xAxis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-xScale(0), 0, 0),
      new THREE.Vector3(xScale(graphWidth), 0, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  scene.add(xAxis);

  const yAxis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -yScale(0), 0),
      new THREE.Vector3(0, yScale(graphHeight), 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );
  scene.add(yAxis);

  const zAxis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -zScale(0)),
      new THREE.Vector3(0, 0, zScale(graphDepth)),
    ]),
    new THREE.LineBasicMaterial({ color: 0x0000ff })
  );
  scene.add(zAxis);
}


// Función de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Iniciar la visualización
init();
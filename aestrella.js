//botones de html usados para cambiar el titulo o mostrarlos Y ocultarlos
var reiniciar = document.getElementById("reiniciar");
var iniciar = document.getElementById("iniciar");
var reanudar = document.getElementById("reanudar");
var parar = document.getElementById("parar");
var mostrar = document.getElementById("mostrar");
var titulo = document.getElementById("titulo");
var costo = document.getElementById("costo");



var canvas;
var ctx;
var FPS = 500;
var intervalo = null;
var intervalo2 = null;
var mostrarcam = true;
var inicio = true;
//ESCENARIO / TABLERO
var columnas = 50;
var filas = 50;
var escenario;  //matriz del nivel

//TILES
var anchoT;
var altoT;

const muro = '#000000';
const tierra = '#FFFFFF';
const final = '#0000FF';


//RUTA
var principio;
var fin;

//configuracion de objetivos
var objsize = 20;
var objetivos = [];

var openSet = [];
var closedSet = [];

var camino = [];
var caminoinv= [];
var terminado = false;




//CREAMOS UN ARRAY 2D
function creaArray2D(f,c){
  var obj = new Array(f);
  for(a=0; a<f; a++){
    obj[a] = new Array(c);
  }
  return obj;
}


//funcion para calcular la estimacion heuristica entre 2 casillas
function heuristica(a,b){
  var x = Math.abs(a.x - b.x);
  var y = Math.abs(a.y - b.y);

  var dist = x+y;

  return dist;
}

//funcion para borrar un elemento de un arreglo
function borraDelArray(array,elemento){
  for(i=array.length-1; i>=0; i--){
    if(array[i] == elemento){
      array.splice(i,1);
    }
  }
}




//funcion para crear cada casilla del canvas con atributos
function Casilla(x,y){

  //POSICIÓN
  this.x = x;
  this.y = y;

  //TIPO (obstáculo=1 , vacío=0  , objetivo=2)
  this.tipo = 0;

  var aleatorio = Math.floor(Math.random()*5);  // 0-4
  if(aleatorio == 1)
      this.tipo = 1;

  //PESOS
  this.f = 0;  //coste total (g+h)
  this.g = 0;  //pasos dados
  this.h = 0;  //heurística (estimación de lo que queda)

  this.vecinos = [];
  this.padre = null;


  //MÉTODO QUE CALCULA SUS VECNIOS
  this.addVecinos = function(){
    if(this.x > 0)
      this.vecinos.push(escenario[this.y][this.x-1]);   //vecino izquierdo

    if(this.x < filas-1)
      this.vecinos.push(escenario[this.y][this.x+1]);   //vecino derecho

    if(this.y > 0)
      this.vecinos.push(escenario[this.y-1][this.x]);   //vecino de arriba

    if(this.y < columnas-1)
      this.vecinos.push(escenario[this.y+1][this.x]); //vecino de abajo
  }



  //MÉTODO QUE DIBUJA LA CASILLA
  this.dibuja = function(){
    var color;

    if(this.tipo == 0)
      color = tierra;

    if(this.tipo == 1)
      color = muro;
    
    if(this.tipo == 2){
      dibujarobjetivo(this.x,this.y);
    }
    else{
      //DIBUJAMOS EL CUADRO EN EL CANVAS
      ctx.fillStyle = color;
      ctx.strokeRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
      ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
    }
    
      
  }



  //DIBUJA OPENSET
  this.dibujaOS = function(){
    ctx.fillStyle = "rgba(48, 255, 38,.5)";
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);

  }

  //DIBUJA CLOSEDSET
  this.dibujaCS = function(){
    ctx.fillStyle = "rgba(26, 177, 255,.5)";
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }


  //DIBUJA CAMINO
  this.dibujaCamino = function(){
    ctx.fillStyle = "rgba(250, 35, 38,.7)";  //amarillo
    //ctx.strokeRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }


}


//funcion donde comienza el algoritmo
function inicializa(){
  if(inicio){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    titulo.style.display="block";
    //CALCULAMOS EL TAMAÑO DE LOS TILES (Proporcionalmente)
    anchoT = parseInt(canvas.width/columnas);
    altoT = parseInt(canvas.height/filas);

    //CREAMOS LA MATRIZ
    escenario = creaArray2D(filas,columnas);
    
  

    //AÑADIMOS LOS OBJETOS CASILLAS
    for(i=0;i<filas;i++){
      for(j=0;j<columnas;j++){
          escenario[i][j] = new Casilla(j,i)
      }
    }

    //AÑADIMOS LOS VECINOS
    for(i=0;i<filas;i++){
      for(j=0;j<columnas;j++){
          escenario[i][j].addVecinos();
      }
    }

    //CREAMOS ORIGEN Y DESTINO DE LA RUTA
    principio = escenario[0][0];
   //fin = escenario[Math.floor(Math.random()*columnas)][Math.floor(Math.random()*filas)];
   //fin.tipo = 2;

    for(i=0 ; i < objsize;i++){
      objetivos[i] = escenario[Math.floor(Math.random()*columnas)][Math.floor(Math.random()*filas)];
      objetivos[i].tipo = 2 ;
    }
    inicio = false;
  }
  
  fin = mascercano();
  //fin = escenario[columnas-1][filas-1];

  //INICIALIZAMOS OPENSET
  openSet.push(principio);

  //EMPEZAMOS A EJECUTAR EL BUCLE PRINCIPAL
  intervalo =setInterval(function(){principal();},1000/FPS);
}


//funcion para saber cual es el objetivo mas cercano por medio del costo de Heuristica
function mascercano(){
  var aux = heuristica(principio,objetivos[0]);
  var casillaaux;
  var arraux = [];
  for(i=0 ; i < objetivos.length;i++){ 
   if(aux >= heuristica(principio,objetivos[i])){
     aux = heuristica(principio,objetivos[i]);
     casillaaux = objetivos[i];
   }
  }
  for(i=0; i < objetivos.length ; i++){
    if(!(objetivos[i] === casillaaux)){
      arraux.push(objetivos[i]);
    }
  }
  objetivos = arraux;
  return casillaaux;
}



function dibujaEscenario(){
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j].dibuja();
    }
  }

  //DIBUJA OPENSET
  if(mostrarcam)
    for(i=0; i<openSet.length; i++){
      openSet[i].dibujaOS();
    }


  //DIBUJA CLOSEDSET
  if(mostrarcam)
    for(i=0; i<closedSet.length; i++){
      closedSet[i].dibujaCS();
    }

  for(i=0; i<camino.length; i++){
    camino[i].dibujaCamino();
  }
  fin.dibuja();
  for(i=0; i<objetivos.length; i++){
    objetivos[i].dibuja();
  }

}


function borraCanvas(){
  canvas.width = canvas.width;
  canvas.height = canvas.height;
}

//dibujamos el robot que caminara el camino mas corto
var img = new Image();
img.src = 'mnc.png';
function dibujarRobot(x,y){
  ctx.drawImage(img ,x*anchoT,y*altoT);
}


//dibujamos el objetivo donde tiene que llegar el robot
var img2 = new Image();
img2.src = 'plc.png';
function dibujarobjetivo(x,y){
  ctx.drawImage(img2 ,x*anchoT,y*altoT);
}





function algoritmo(){
  titulo.textContent = "Buscando camino..."
  //SEGUIMOS HASTA ENCONTRAR SOLUCIÓN
  if(terminado!=true){

    //SEGUIMOS SI HAY AlGO EN OPENSET
    if(openSet.length>0){
      var ganador = 0;  //índie o posición dentro del array openset del ganador

      //evaluamos que OpenSet tiene un menor coste / esfuerzo
      for(i=0; i<openSet.length; i++){
        if(openSet[i].f < openSet[ganador].f){
          ganador = i;
        }
      }

      //Analizamos la casilla ganadora
      var actual = openSet[ganador];

      //SI HEMOS LLEGADO AL FINAL BUSCAMOS EL CAMINO DE VUELTA
      if(actual === fin){

        var temporal = actual;
        camino.push(temporal);
        while(temporal.padre!=principio.padre){
          temporal = temporal.padre;
          camino.push(temporal);
        }
        console.log('camino encontrado');
        terminado = true;
        clearInterval(intervalo);
        for(let i = camino.length-1 ; i >= 0 ; i--){
            caminoinv.push(camino[i]);
        }
        titulo.textContent = "Recorriendo el camino";
        costo.textContent  = "Costo Total: " + fin.f ;
        intervalo2 =setInterval(function(){MoverRobot();},1000/10);
      }

      //SI NO HEMOS LLEGADO AL FINAL, SEGUIMOS
      else{
        borraDelArray(openSet,actual);
        closedSet.push(actual);

        var vecinos = actual.vecinos;

        //RECORRO LOS VECINOS DE MI GANADOR
        for(i=0; i<vecinos.length; i++){
          var vecino = vecinos[i];

          //SI EL VECINO NO ESTÁ EN CLOSEDSET Y NO ES UNA PARED, HACEMOS LOS CÁLCULOS
          if(!closedSet.includes(vecino) && vecino.tipo!=1){
            var tempG = actual.g + 1;

            //si el vecino está en OpenSet y su peso es mayor
            if(openSet.includes(vecino)){
              if(tempG < vecino.g){
                vecino.g = tempG;     //camino más corto
              }
            }
            else{
              vecino.g = tempG;
              openSet.push(vecino);
            }

            //ACTUALIZAMOS VALORES
            vecino.h = heuristica(vecino,fin);
            vecino.f = vecino.g + vecino.h;

            //GUARDAMOS EL PADRE (DE DÓNDE VENIMOS)
            vecino.padre = actual;

          }
        }
      }

    }

    else{
      console.log('No hay un camino posible');
      terminado = true;   //el algoritmo ha terminado
    }



  }

}



function principal(){
  borraCanvas();
  algoritmo();
  dibujaEscenario();
  dibujarRobot(principio.x,principio.y);
  
}
//funcion cuando se encuetra el camino el robot caminara al destino
let contador = 0;
function MoverRobot(){
    parar.disabled = true;
  if(contador < caminoinv.length){
    borraCanvas();
    dibujaEscenario();
    dibujarRobot(caminoinv[contador].x,caminoinv[contador].y);
    contador++;
  }
  else {
    if(objetivos.length == 0){
      titulo.textContent = "Robot llego al camino!! :D";
      openSet = [];
      closedSet = [];
      camino = [];
      caminoinv = [];
      borraCanvas();
      dibujaEscenario();
      dibujarRobot(fin.x,fin.y);
      clearInterval(intervalo2);
    }else{
      parar.disabled =false;
      openSet = [];
      closedSet = [];
      camino = [];
      caminoinv = [];
      fin.tipo=0;
      principio = fin;
      dibujarRobot(principio.x,principio.y);
      terminado = false;
      contador = 0;
      borraCanvas();
      dibujaEscenario();
      clearInterval(intervalo2);
      inicializa();
    }
  }
}



function Iniciar(){
  reiniciar.style.display="block";
  iniciar.style.display="none";
  inicializa();
}


function Reanudar(){
  parar.style.display="block";
  reanudar.style.display="none";
  intervalo =setInterval(function(){principal();},1000/FPS);
}

function Reiniciar(){
  reiniciar.style.display="none";
  iniciar.style.display="block";
  location.reload();
  inicializa();
}

function Parar(){
  parar.style.display="none";
  reanudar.style.display="block";
  clearInterval(intervalo);
  borraCanvas();
  algoritmo();
  dibujaEscenario();
  dibujarRobot(principio.x,principio.y);

}

function Mostrar(){
 mostrarcam = !mostrarcam;
 if(mostrarcam)
  mostrar.textContent = "Ocultar";
 else
  mostrar.textContent = "Mostrar";
 borraCanvas();
 dibujaEscenario();
 dibujarRobot(principio.x,principio.y);
}
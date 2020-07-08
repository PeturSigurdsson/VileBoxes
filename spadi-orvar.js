var canvas;
var gl;
var points;
var box = [], bars = []; 
var spadi, kula, xball, yball, xmove, objects, go, loss, maxSpeed, spadiSpeed;
window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    scoreBoard =  document.getElementById( "scoreBoard" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
    
    // Load buffer into the GPU
    var buff = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buff );
    gl.bufferData( gl.ARRAY_BUFFER, objects*4*8, gl.DYNAMIC_DRAW );
	launchGame();
	// Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
		
    // Event listener for keyboard
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 37:	// vinstri ör
                xmove = -spadiSpeed;
                break;
            case 39:	// hægri ör
                xmove = spadiSpeed;
                break;
			case 87:	// w
                yball += 0.00004;
				xmove = 0;
                break;
			case 65:	// a
                xball += -0.00004;
				xmove = 0;
                break;
			case 83:	// s
                yball += -0.00004;
				xmove = 0;
                break;
			case 68:	// d
                xball += 0.00004;
				xmove = 0;
                break;
			case 13:	// d
                launchGame();
                break;
            default:
                xmove = 0.0;
        }
    } );
	window.addEventListener("keyup", function(e){
		var code = e.keyCode;
		if(code == 37 || code == 39){
			xmove = 0;
		}
	});
}

// Sets elements to start a game.
function launchGame(){
	go = false;
	loss = false;
	maxSpeed = 0.03;
	spadiSpeed = 0.02;
	document.getElementById("goScreen").innerHTML  = "";
	spadi = [
        vec2( -0.1, -0.9 ),
        vec2( -0.1, -0.86 ),
        vec2(  0.1, -0.86 ),
        vec2(  0.1, -0.9 ) 
    ];
	var kulaStadur = Math.random()*2-1
	kula = [
        vec2( kulaStadur-0.01, kulaStadur+0.01 ),
        vec2( kulaStadur-0.01, kulaStadur-0.01),
        vec2( kulaStadur+0.01, kulaStadur-0.01 ),
        vec2( kulaStadur+0.01, kulaStadur+0.01 ) 
    ];
	
    points = 0;
	scoreBoard.innerHTML = "Your score: "+points;
	objects = 2;
	box = [];
	bars = [];
	xball = (Math.random()*2-1)*maxSpeed;
	yball =  Math.random()*maxSpeed;
	if(xball > 0 && xball < 0.006 || xball < 0 && xball > -0.006) xball = xball*2;
	if(yball < 0.006) yball = yball*2;
	xmove = 0;
	render();
}

// Main movement logic.
var lastTime = 0;
function animate(){
	var timeNow = new Date().getTime();
    if (timeNow - lastTime > 10) {
        if(Math.random()>0.998){
			createBox();
		}

		if(xball > maxSpeed) xball = maxSpeed;
		else if(xball < -maxSpeed) xball = -maxSpeed;
		else if(yball > maxSpeed) yball = maxSpeed;
		else if(yball < -maxSpeed) yball = -maxSpeed;

		moveKula();
		moveSpadi();
		
		gl.bufferSubData(gl.ARRAY_BUFFER, 32, flatten(kula));
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(spadi));
		lastTime = timeNow;
	}
}

// Draws static elements box and bars.
function drawStatic(){
	gl.bufferData( gl.ARRAY_BUFFER, (objects)*4*8, gl.DYNAMIC_DRAW );
	var bl = box.length;
	for(i=0;i<bl;i++){
		gl.bufferSubData(gl.ARRAY_BUFFER, (2+i)*4*8, flatten(box[i]));
	}

	var barLength = bars.length;
	for(i=bl;i<barLength+bl;i++){
		gl.bufferSubData(gl.ARRAY_BUFFER, (2+i)*4*8, flatten(bars[i-bl]));
	}

}

// Moves kula according to xball and yball.
function moveKula(){
	canvasCollision();
	spadiCollision();
	boxCollision();
	for(i=0; i<kula.length; i++) {
		kula[i][0] += xball;
		kula[i][1] += yball;
	}
}

// Moves spadi to left or right.
function moveSpadi(){
	if(spadi[2][0]+xmove <= 1.04){
		if(spadi[0][0]+xmove >= -1.04){
			for(i=0; i < spadi.length; i++){
				spadi[i][0] += xmove;
			}
		}
	}
}

// Creates point bars (1 for every box or 100 points).
function drawBar(){
	left = -0.95 + bars.length*0.02;
	right = -0.94 + bars.length*0.02;
	tops = 0.95;
	bottom = 0.90;
	bar = [	vec2(left,tops),
			vec2(left,bottom),
			vec2(right,bottom),
			vec2(right,tops)
	];
	bars.push(bar);
	objects += 1;
	drawStatic();
}

// Creates static boxes, special case if loss or bars.length is close to 10.
function createBox(){
	if(!go || loss){
		
		var num = parseInt(Math.random()*3+3);
		if(box.length + bars.length + num > 10 && !loss){
			num = 10 - box.length - bars.length;
		}
		var x;
		var y;
		if(loss){
			num = 600;
		}
		for(i=0; i < num; i++){
			x = Math.random()*2-1;
			y = Math.random();
			if(loss) y = Math.random()*2-1;
			var boxPos = vec2(x,y);
			var boxSize = Math.random()*0.1+0.01;
			
			aBox =[	vec2(boxPos[0]-boxSize,boxPos[1]+boxSize),
					vec2(boxPos[0]-boxSize,boxPos[1]-boxSize),
					vec2(boxPos[0]+boxSize,boxPos[1]-boxSize),
					vec2(boxPos[0]+boxSize,boxPos[1]+boxSize)
			];
			objects += 1;
			box.push(aBox);
			
		}
		drawStatic();
	}
}

// Detects collision with boxes and deletes the right box.
function boxCollision(){
	//01 = up, 11 = down, 10 = left, 20 = right.
	var collision = false;
	for(i=0;i<box.length;i++){
		collision = kula[1][1]<=box[i][0][1]&&kula[0][1]>=box[i][1][1]&&kula[1][0]<=box[i][2][0]&&kula[2][0]>=box[i][1][0];
		if(collision && !loss){
			
			points += 1;
			scoreBoard.innerHTML = "Your score: "+points;
			objects -= 1;
			box.splice(i,1);
			drawBar();
			break;
		}
	}
	if(collision){
		drawStatic();
	}
	if(box.length < 1){
		createBox();
	}
	if(bars.length > 9){
		gameOver("Congratulations! <br> you've destroyed the vile red <br> boxes and saved the universe. <br> Consider yourself a hero.");
	}
	
}
lastSC = 0;
// Detects collision with spadi, bounces ball.
function spadiCollision(){
	var timeNow = new Date().getTime();
    if (timeNow - lastSC > 20) {
        if(kula[1][1] <= spadi[1][1])
		if(kula[2][0] >= spadi[0][0] && kula[0][0] <= spadi[2][0]){
			yball = yball*-1;
			if(Math.abs(kula[2][0] - spadi[0][0])< Math.abs(kula[0][0] - spadi[2][0]) && xball > 0)
				xball = xball*-1;
			else if(Math.abs(kula[2][0] - spadi[0][0]) > Math.abs(kula[0][0] - spadi[2][0]) && xball < 0)
				xball = xball*-1;
		}
		lastSC = timeNow;
	}
}

var lastCC = 0;
// Bounces ball or calls gameOver() kula touches canvas borders.
function canvasCollision(){
	var timeNow = new Date().getTime();
	
    if (timeNow - lastCC > 10) {

			if(kula[0][1]>1) yball = yball*-1;
			else if(kula[1][1]<-1) return gameOver("GAME OVER! <br> "+points+" points.");

			if(kula[2][0]>1) xball = xball*-1;
			else if(kula[0][0]<-1)xball = xball*-1;

		lastCC = timeNow;
	}
}
// Sets boolean go to true, sets static objects and text for win or lose situations.
function gameOver(str){
	if(!go){
		objects -= bars.length;
	
		bars = [];
		xball = 0;
		if(str.indexOf("GAME")>-1) {
			loss = true;
			createBox();
		}
		else {
			objects -= box.length;
			box = [];
		}
		var goScreen =  document.getElementById( "goScreen" );
		goScreen.innerHTML = str;
		go = true;
	}
	return 0;
}
// Clears buffer and draws in a recursive loop, but only if game is on.
// Special case if loss = true it renders one more time to show boxes.
function render() {
	if(!go){
		window.requestAnimFrame(render);
	}
	if(loss){
		window.requestAnimFrame(render);
		loss = false;
	}
		gl.clear( gl.COLOR_BUFFER_BIT );
		for(i=0;i<objects;i++){
			gl.drawArrays( gl.TRIANGLE_FAN, i*4, 4 );
		}
		animate();
}

function TrackerController($scope)
{
	$scope.head  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand2 = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.pointer = {position: [0,0], zoom:0, buttons:[0,0,0]};

	console.log("Href ", window.location.href);

	//var url = 'http://' + window.location.hostname + ':8080';
	//var url = window.location.href;
        var url = window.location.origin;
	var socket = io.connect( url );
	console.log("Connected to server: ", url);
	window.socket = socket;

	socket.on('head', function (data) {
		// force angular update
		$scope.$apply(function() {
			$scope.head.text  = data.text;
			$scope.head.rotation  = data.rot;
			$scope.head.position  = data.pos;
		});
  	});
	socket.on('wand', function (data) {
		// force angular update
		$scope.$apply(function() {
			$scope.wand.text  = data.text;
			$scope.wand.rotation  = data.rot;
			$scope.wand.position  = data.pos;
		});
  	});
	socket.on('wand2', function (data) {
		// force angular update
		$scope.$apply(function() {
			$scope.wand2.text = data.text;
			$scope.wand2.rotation  = data.rot;
			$scope.wand2.position  = data.pos;
		});
  	});

	// Process 'Pointer' data type (sagePointer)
	socket.on('pointer', function (data) {
		// force angular data
		$scope.$apply(function() {
			$scope.pointer.position = [data.x,data.y];
			$scope.pointer.zoom     = data.zoom;
			$scope.pointer.buttons  = [data.b1,data.b2,data.b3];
		});
  	});



}

window.onbeforeunload = function (event) {
  var message = 'Sure you want to leave?';
  if (typeof event == 'undefined') {
    event = window.event;
  }
  if (event) {
    event.returnValue = message;
  }
  return message;
}



function TrackerController($scope)
{	
	$scope.head  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand2 = {text:null, position:[0,0,0], rotation:[0,0,0]};
	//$scope.pointer = {label:" ", ip:" ", position: [0,0], zoom:0, buttons:[0,0,0]};
	$scope.ptrs = {};
	$scope.numptrs = 0;

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
			if (data.id in $scope.ptrs) {
				// pass
			} else {
				$scope.numptrs = $scope.numptrs + 1;
			}
			$scope.ptrs[ data.id ] = data;
			
			// $scope.pointer.label    = data.label;
			// $scope.pointer.ip       = data.ip;
			// $scope.pointer.position = data.position;
			// $scope.pointer.zoom     = data.zoom;
			// $scope.pointer.buttons  = data.mouse;

			// {label:ptrinfo[0], ip:ptrinfo[1], mouse:[], color:colorpt, zoom:0, position:[0,0]};

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



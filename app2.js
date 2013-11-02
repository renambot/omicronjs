function Tracker($scope)
{
	$scope.head  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand  = {text:null, position:[0,0,0], rotation:[0,0,0]};
	$scope.wand2 = {text:null, position:[0,0,0], rotation:[0,0,0]};

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

      function cBuffer(capacity) {
          if (!(capacity > 0)) {
              throw new Error();
          }

          var pointer = 0, buffer = [];

          var publicObj = {
              get: function (key) {
                  if (key === undefined) {
                      // return all items in the order they were added
                      if (pointer == 0 || buffer.length < capacity) {
                          // the buffer as it is now is in order
                          return buffer;
                      }
                      // split and join the two parts so the result is in order
                      return buffer.slice(pointer).concat(buffer.slice(0, pointer));
                  }
                  return buffer[key];
              },
              push: function (item) {
                  buffer[pointer] = item;
                  pointer = (capacity + pointer + 1) % capacity;
                  // update public length field
                  publicObj.length = buffer.length;
              },
              capacity: capacity,
              length: 0
          };

          return publicObj;
      }
      var bufH = cBuffer(20);
      var bufW = cBuffer(20);


      var cw = $("#container").width();
      var ch = $("#container").height();
      
      var minX = -3.5;
      var maxX =  3.5;
      var minY = -2.5;
      var maxY =  4.5;
      var unitTicksX = 10;
      var unitTicksY = 10;

      var stage = new Kinetic.Stage({
        container: 'container',
        width : cw,
        height : ch,
      });

      var layer = new Kinetic.Layer();
      console.log("Layer: ", cw, ch);

      var graph_frame = new Kinetic.Line({
        points: [10,10,cw-10,10,cw-10,ch-10,10,ch-10,10,10],
        stroke: 'red',
        strokeWidth: 2,
        lineJoin: 'round',
      });
      layer.add(graph_frame);

      var xAxis = new Kinetic.Line({
        points: [0,0, maxX,0],
        stroke: 'red',
        strokeScaleEnabled: false,
        strokeWidth: 4
      });
      xAxis.setScale( cw, ch );
      xAxis.setPosition( 0, maxY *ch / (maxY-minY) );
      layer.add(xAxis);

      var yAxis = new Kinetic.Line({
        points: [0,0, 0,maxY],
        stroke: 'red',
        strokeScaleEnabled: false,
        strokeWidth: 4
      });
      yAxis.setScale( cw , ch );
      yAxis.setPosition( - minX*cw / (maxX-minX), 0);
      layer.add(yAxis);

      var dataHead = new Kinetic.Line({
        points: [ {x:0,y:0} ],
        stroke: 'blue',
        strokeScaleEnabled: false,
        strokeWidth: 4
      });
      dataHead.setScale( cw / (maxX-minX) , ch / (maxY-minY) );
      dataHead.setPosition( - minX*cw / (maxX-minX), (maxY-1) *ch / (maxY-minY));
      layer.add(dataHead);

      var dataWand = new Kinetic.Line({
        points: [ {x:0,y:0} ],
        stroke: 'green',
        strokeScaleEnabled: false,
        strokeWidth: 4
      });
      dataWand.setScale( cw / (maxX-minX) , ch / (maxY-minY) );
      dataWand.setPosition( - minX*cw / (maxX-minX), (maxY-1) *ch / (maxY-minY));
      layer.add(dataWand);

      stage.add(layer);


    // Returns a random number between min and max
    function getRandomArbitrary(vmin, vmax) {
      return Math.random() * (vmax - vmin) + vmin;
    }

     function addData() {
        xx = $scope.head.position[0];
        yy = $scope.head.position[2];
        bufH.push( {x:xx,y:yy} );
        dataHead.setPoints( bufH.get() );

        xx = $scope.wand.position[0];
        yy = $scope.wand.position[2];
        bufW.push( {x:xx,y:yy} );
        dataWand.setPoints( bufW.get() );

        layer.draw();

        setTimeout(function() {
          addData();
        }, 200);
  
     };

      setTimeout(function() {
        addData();
      }, 200);

};



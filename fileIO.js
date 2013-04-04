    // load file
    function loadFile() {
        var input, file, fr, result;
        var floatArray = undefined;
	var size = new Object();
	var image = new Object();


        if (typeof window.FileReader !== 'function') {
            bodyAppend("p", "The file API isn't supported on this browser yet.");
            return;
        }

        input = document.getElementById('fileinput');
        if (!input) {
            bodyAppend("p", "Um, couldn't find the fileinput element.");
        }
        else if (!input.files) {
            bodyAppend("p", "This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
            bodyAppend("p", "Please select a file before clicking 'Load'");
        }
        else {
            file = input.files[0];
            fr = new FileReader();

            fr.onload = receivedBinary;
            fr.readAsBinaryString(file);

        }
 
        function receivedBinary() {
            showResult(fr, "Binary");
            size = sizeImage(fr, "Binary");

            floatArray = convert2Float(fr,'Binary');
            floatArray = normalize(floatArray);
        }
        alert('loading');
		
	image.array = floatArray;
	image.size = size;
        return  image;
    }


    // normalize the data from -3sigma to 3sigma
    function normalize(floatArray) {
        var length = floatArray.length;
        var max, min, sum;
	max = 0;
	min = 0;
	sum =0;
        // find the max and min value 
        for (var i = 0; i < length; ++i) {
            if (i == 0) {
                max = floatArray[0];
                min = floatArray[0];
		sum = floatArray[0];
            }
            if (floatArray[i] >  max ) {
	      max = floatArray[i];
	    }
                
            if (floatArray[i] < min) {
                min = floatArray[i];
	    }
	    sum = sum + floatArray[i];
        }
        
        // sigma
  	var mean = 0;
 	var sigma = 0;
  	mean = sum / length;
  	for (var i = 0; i < length; ++i) {
 	    sigma =  sigma + ((floatArray[i] - mean) * (floatArray[i] - mean));
         }
         sigma = Math.sqrt(sigma/ length);  
	
             
        // normalization
        for (var i = 0; i < length; ++i) {
            floatArray[i] = ((floatArray[i] - min)/(max-min) );
        }
        
         // smooth
  	for (var i = 0; i < length; ++i) {
              if (floatArray[i] > 3*sigma + mean)
   	      floatArray[i] = 1;
	      if (floatArray[i] < -3*sigma + mean)
   	      floatArray[i] = 0;
           }
	
        return floatArray;
    }
    
    // display the size of EM image
    function showResult(fr, label) {
        var markup, result, n, aByte, byteStr;

        markup = [];
        result = fr.result;
        for (n = 0; n < 100; ++n) {
            aByte = result.charCodeAt(n);
            byteStr = aByte.toString(10);
            if (byteStr.length < 2) {
                byteStr = "0" + byteStr;
            }
            markup.push(byteStr);
        }
    }
    
    // convert the raw data from binary to float
    function convert2Float(fr,label) {
        var markup, result, n, aByte, byteStr;

        markup = [];
        result = fr.result;
        var floatArray = new Array();
        var head = 512;
        var typeLength = 4;
        var a, b, c, d, value;
        for (n = 0; n < result.length; n= n + typeLength) {
            a = result.charCodeAt(n+head);
            b = result.charCodeAt(n+1+head);
            c = result.charCodeAt(n+2+head);
            d = result.charCodeAt(n+3+head);
            value = a | b<<8 | c << 16| d << 24;
            value = hex2float(value);
            floatArray.push(value);
        }
        return floatArray;
    }
    
    // convert data from hex to float
    function hex2float(num) {
        var sign = (num & 0x80000000) ? -1 : 1;
        var exponent = ((num >> 23) & 0xff) - 127;
        var mantissa = 1 + ((num & 0x7fffff) / 0x7fffff);
        return sign * mantissa * Math.pow(2, exponent);
    }

    // z aix zoom
    function middleSliceZ(floatArray, x_length, y_length, zAix) {
        var slice = new Array();
        var offset, n, i = 0;
        offset = x_length * y_length * zAix;

        for (n = 0; n < x_length * y_length; n++ ) {
            slice[i] = floatArray[n + offset];
            i++;
        }
        return slice;
    }
    
    // y aix zoom
    function middleSliceY(floatArray, x_length, yAix, z_length) {
        var slice = new Array();
        var i, j;
	var n = 0;
	for (i = 0; i< x_length; i++) { 
	  for (j = 0; j< z_length; j++) {
	    slice[n] = floatArray[ x_length*y_length*j + yAix*x_length + i];
	    n++;
	  }
	}
        return slice;
    }
    
    // x aix zoom
    function middleSliceX(floatArray, xAix, y_length, z_length) {
        var slice = new Array();
        var i, j;
	var n = 0;
	for (i = 0; i< y_length; i++) { 
	  for (j = 0; j< z_length; j++) {
	    slice[n] = floatArray[ x_length*y_length*j + i*x_length + xAix];
	    n++;
	  }
	}
        return slice;
    }
    
    // get the image size
    function sizeImage(fr, label) {
        var markup,result, n, byteStr;
        var a, b, c ,d;
        var x_lenght, y_length, z_length;
	var size = new Object();
        markup = [];
        result = fr.result;
        for (n = 4; n < 16; n = n + 4) {
            a = result.charCodeAt(n);
            b = result.charCodeAt(n+1);
            c = result.charCodeAt(n+2);
            d = result.charCodeAt(n+3);
            if (n == 4) {
                 x_length = a | b<<8 | c << 16| d << 24;
                 byteStr = x_length.toString(10);
                 markup.push(byteStr);
            }
            if (n == 8) {
                y_length = a | b<<8 | c << 16| d << 24;
                byteStr = y_length.toString(10);
                markup.push(byteStr);
            }
            if ( n == 12) {
                z_length = a | b<<8 | c << 16| d << 24;
                byteStr = z_length.toString(10);
                markup.push(byteStr);
            }
    
        }
        size.xlength = x_length;
	size.ylength = y_length;
	size.zlength = z_length;
	
        bodyAppend("p", label + " (" + result.length + "):");
        bodyAppend("pre", markup.join(" "));
	
	return size;
    }
    
    // append on the HTML page
    function bodyAppend(tagName, innerHTML) {
        var elm;

        elm = document.createElement(tagName);
        elm.innerHTML = innerHTML;
        document.body.appendChild(elm);
	return elm;	
    }
    
    // remove the append on the HTML page
    function bodyAppendRemove(elm) {
	document.body.removeChild(elm);	
    }
    
    
    // display the image 
    var x_length, y_length, z_length;
    var elm;
    function doit() {
        var Image = new Object();
     
        Image = loadFile();
	floatArray = Image.array;
	x_length = Image.size.xlength;
	y_length = Image.size.ylength;
	z_length = Image.size.zlength;
	
	// defaut: the view of Z aix. 
        var slice = middleSliceZ(floatArray,x_length,y_length,z_length/2);
        drawScene(slice,x_length,y_length,z_length);
	elm = bodyAppend("p", 'Z' + ":" + " (" + z_length/2 + ")");
	
    }
    
    // zoom +, Z aix
    var counterZ = 0;
    function moveUpZ(){
	var zAix, zslice;
	counterZ = counterZ + 1;
	zAix = z_length/2 + counterZ;
	if (zAix <0 || zAix >= z_length)
	  alert("out of the range!!!");
	zslice = middleSliceZ(floatArray,x_length,y_length,zAix);
        drawScene(zslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Z' + ":" + " (" + zAix + ")");
    }
    
    // zoom +, Y aix
    var counterY = 0;
    function moveUpY(){
	var yAix, yslice;
	counterY = counterY + 1;
	yAix = y_length/2 + counterY;
	if (yAix <0 || yAix >= y_length)
	  alert("out of the range!!!");
	yslice = middleSliceY(floatArray,x_length,yAix,z_length);
        drawScene(yslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Y' + ":" + " (" + yAix + ")");
    }
    
    // zoom +, X aix
    var counterX = 0;
    function moveUpX(){
	var xAix, xslice;
	counterX = counterX + 1;
	xAix = x_length/2 + counterX;
	if (xAix <0 || xAix >= x_length)
	  alert("out of the range!!!");
	xslice = middleSliceX(floatArray,xAix,y_length,z_length);
        drawScene(xslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'X' + ":" + " (" + xAix + ")");
    }
    
    // zoom -; Z aix
    function moveDownZ(){
	var zAix, zslice;
	counterZ = counterZ - 1;
	zAix = z_length/2 + counterZ;
 	if (zAix <0 || zAix >= z_length)
	  alert("out of the range!!!");
	zslice = middleSliceZ(floatArray,x_length,y_length,zAix);
        drawScene(zslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Z' + ":" + " (" + zAix + ")");
    }
    
    // zoom -; Y aix
    function moveDownY(){
	var yAix, yslice;
	counterY = counterY - 1;
	yAix = y_length/2 + counterY;
	if (yAix <0 || yAix >= y_length)
	  alert("out of the range!!!");
	yslice = middleSliceY(floatArray,x_length,yAix,z_length);
        drawScene(yslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Y' + ":" + " (" + yAix + ")");
    }
    
    // zoom -; X aix
    function moveDownX(){
	var xAix, xslice;
	counterX = counterX - 1;
	xAix = x_length/2 + counterX;
	if (xAix <0 || xAix >= x_length)
	  alert("out of the range!!!");
	xslice = middleSliceX(floatArray,xAix,y_length,z_length);;
        drawScene(xslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'X' + ":" + " (" + xAix + ")");
    }
    
    // setZ
    function setSliceZ(value) {
        var zAix = value.value;
	counterZ = zAix - z_length /2 ; 
	if (zAix > z_length || zAix < 0 )
	  alert("input out of range!!!");
	var zslice;
	
	zslice = middleSliceZ(floatArray,x_length,y_length,zAix);
        drawScene(zslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Z' + ":" + " (" + zAix + ")");
    }
    
    // setY
    function setSliceY(value) {
        var yAix = value.value;
	counterY = yAix - y_length /2 ; 
	if (yAix > y_length || yAix < 0 )
	  alert("input out of range!!!");
	var yslice;
	
	yslice = middleSliceY(floatArray,x_length,yAix,z_length);
        drawScene(yslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'Y' + ":" + " (" + yAix + ")");
    }
    
    // setX
    function setSliceX(value) {
        var xAix = value.value;
	counterX = xAix - x_length /2 ; 
	if (xAix > x_length || xAix < 0 )
	  alert("input out of range!!!");
	var xslice;
        
	xslice = middleSliceX(floatArray,x_length/2+counterX,y_length,z_length);;
        drawScene(xslice,x_length,y_length,z_length);
	bodyAppendRemove(elm);
	elm = bodyAppend("p", 'X' + ":" + " (" + xAix + ")");
    }


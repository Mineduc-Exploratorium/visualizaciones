$().ready(function() {
	vista = new VistaPrincipal({el:"#mainchart"});
});

// VistaPrincipal
// ===================
// Vista principal con datos de ...
//
var VistaPrincipal = Backbone.View.extend({
	el:"body",
	
	initialize: function() {
		_.bindAll(this,"render")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 40},
    	this.width = 800 - this.margin.left - this.margin.right,
    	this.height = 650 - this.margin.top - this.margin.bottom;

		// Vista con tooltip para mostrar datos del item
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
 
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/oa2012sies.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
		});
	},

	// tooltipMessage
	// --------------
	// Genera el texto (html) que se desplegará en el tooltip
	// utilizando datos del objeto "data"  (Ej. data = {nombre:"Juan"})
	tootipMessage: function(data) {
		// Atributos
		// CODIGO_UNICO	TIPO_INSTITUCION	INSTITUCION	SEDE	REGION	CARRERA	HORARIO	NOTAS_EM	PRUEBA_LENGUAJE	PRUEBA_MATEMATICAS	PRUEBA_HISTORIA	PRUEBA_CIENCIAS	OTROS	VACANTES_PRIMER_SEMESTRE	VACANTES_SEGUNDO_SEMESTRE	VALOR_MATRICULA	VALOR_ARANCEL	DURACION_SEMESTRES	AREA	ACREDITACION_CARRERA
		var msg = "<span class='text-info'>"+data.CARRERA+"</span>";
		msg += "<br>"+ data.INSTITUCION;
		msg += "<br>Sede: "+ data.SEDE;
		msg += "<br>Horario: "+ data.HORARIO;
		msg += "<br>Horario: "+ data.ACREDITACION_CARRERA;
		return msg;
	},

	render : function() {
		var nestedData = d3.nest()
			.key(function(d) {return "Chile"})
			.key(function(d) {return d.TIPO_INSTITUCION})
			.key(function(d) {return d.INSTITUCION})
			.entries(this.data);

		var treemap = d3.layout.treemap()
    		.size([1000, 1000])
    		.sticky(true)
    		.children(function(d) {return d.values })
    		.value(function(d) { return d.VACANTES_PRIMER_SEMESTRE; });

    	var nodes = treemap.nodes(nestedData[0]);

		var margin = {top: 40, right: 10, bottom: 10, left: 10},
		    width = 960 - margin.left - margin.right,
		    height = 500 - margin.top - margin.bottom;

		var color = d3.scale.category10();

		var div = d3.select("body").append("div")
		    .style("position", "relative")
		    .style("width", (width + margin.left + margin.right) + "px")
		    .style("height", (height + margin.top + margin.bottom) + "px")
		    .style("left", margin.left + "px")
		    .style("top", margin.top + "px");


		var node = div.selectAll(".node")
		  .data(nodes)
		.enter().append("div")
		  .attr("class", function(d) {
		  	// Si son carreras
		  	if (d.depth == 3) {
		  		return d.ACREDITACION_CARRERA == "Acreditada" ? "node leaf acreditada" : "node leaf noacreditada"
		  	} else {
		  		return "node"
		  	}
		  })
		  .call(position)
		  .style("background", function(d) { return (d.values && d.depth==1) ? color(d.key) : null; })
		  .text(function(d) { return d.children ? null : d.key; });


		function position() {
		  this.style("left", function(d) { return d.x + "px"; })
		      .style("top", function(d) { return d.y + "px"; })
		      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
		}


	},

	render2: function() {
		self = this; // Para hacer referencia a "this" en callback functions

		// Ordenar datos segñun acreditación
		this.data = _.sortBy(this.data, function(d) {return d.ACREDITACION_CARRERA});		

		// Generar arreglos con datos por tipo de institución
		var dataIP =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="INSTITUTO PROFESIONAL"});
		var dataUParticular =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD PARTICULAR"});
		var dataUEstatal =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD ESTATAL"});
		var dataCFT =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="CENTRO DE FORMACIÓN TÉCNICA"});
		var dataUParticularConAporte =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD PARTICULAR CON APORTE"});

		var radious = 2.5

		// Calcular el ancho de cada grupo tipo de IE como proporción del ancho total
		var widthCFT = Math.ceil(this.width*dataCFT.length/this.data.length);
		var widthIP = Math.ceil(this.width*dataIP.length/this.data.length);
		var widthUEstatal= Math.ceil(this.width*dataUEstatal.length/this.data.length);
		var widthUParticular = Math.ceil(this.width*dataUParticular.length/this.data.length);
		var widthUParticularConAporte= Math.ceil(this.width*dataUParticularConAporte.length/this.data.length);

		// Calcular posición x de cada tipo de IE
		var uMargin = 3
		var xCFT = 0;
		var xIP = xCFT+widthCFT+uMargin;
		var xUEstatal = xIP+widthIP+uMargin;
		var xUParticularConAporte = xUEstatal+widthUEstatal+uMargin;
		var xUParticular = xUParticularConAporte+widthUParticularConAporte+uMargin;

		/// Contenedor principal SVG
		// ------------------------
		// Genera elemento SVG contenedor principal de gráficos
		this.svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		var leyenda = d3.select(this.el).select("svg")
			.append("g")
			.attr("transform", "translate(" + this.margin.left + ",0)");


		leyenda.append("rect")
			.attr("y", 10)
			.attr("x", 0)
			.attr("class", "node-dot acreditada")
		    .attr("width", 8)
		    .attr("height", 8);
		    
		leyenda.append("text")
			.attr("y","20")
			.attr("x","20")
			.attr("height",20)
			.text("Acredidata");

		leyenda.append("rect")
			.attr("y", 10)
			.attr("x", 100)
			.attr("class", "node-dot noAcreditada")
		    .attr("width", 8)
		    .attr("height", 8);
		    
		leyenda.append("text")
			.attr("y","20")
			.attr("x","120")
			.attr("height",20)
			.text("No Acredidata");


		// Genera el contenedor para cada tipo de IE y construyye la vista asociada
		var svgCFT = this.svg.append("svg").attr("x", xCFT).attr("class","pixelmaps CFT");
		var pixelMap = new VistaCarrerasPixelMapV({el:"svg.pixelmaps.CFT", data: dataCFT, width:widthCFT, radious:radious, label:"CFT"});

		var svgIP = this.svg.append("svg").attr("x", xIP).attr("class","pixelmaps IP");
		var pixelMap = new VistaCarrerasPixelMapV({el:"svg.pixelmaps.IP", data: dataIP, width:widthIP, radious:radious, label:"IP"});

		var svgUEstatal = this.svg.append("svg").attr("x", xUEstatal).attr("class","pixelmaps UEstatal");
		var pixelMap = new VistaCarrerasPixelMapV({el:"svg.pixelmaps.UEstatal", data: dataUEstatal, width:widthUEstatal, radious:radious, label:"U. Estatal"});

		var svgUParticularConAporte = this.svg.append("svg").attr("x", xUParticularConAporte).attr("class","pixelmaps UParticularConAporte");
		var pixelMap = new VistaCarrerasPixelMapV({el:"svg.pixelmaps.UParticularConAporte", data: dataUParticularConAporte, width:widthUParticularConAporte, radious:radious, label:"U. Part.", label2:"c/Aporte"});

		var svgUParticular = this.svg.append("svg").attr("x", xUParticular).attr("class","pixelmaps UParticular");
		var pixelMap = new VistaCarrerasPixelMapV({el:"svg.pixelmaps.UParticular", data: dataUParticular, width:widthUParticular, radious:radious, label:"U. Particular"});

		d3.select(this.el)
			.append("div")
			.attr("class","mute")
			.text("Fuente: http://www.mifuturo.cl/images/Base_de_datos/Oferta_academica/oapregrado2012.rar (16464 registros)")

		$("body").append(this.tooltip.render().$el);

	}

});

// VistaToolTip
// ----------------------------
// Muestra tooltip con mini ficha del item (se ubica al hacer rollover sobre el item)
var VistaToolTip = Backbone.View.extend({

	initialize: function() {

	},

	// show
	// ----
	// Genera el menaje a mostrar (de acuerdo a datos ingresados) y muestra el tooltip en la
	// posición indicada
	//
	// data: {nombre_establecimientos:"Escuela Arturo Prat", rbd: 123, ...}
	// pos : {x: 100, y: 250}
	show: function(data, pos) {
		$tooltip = this.$el;
		$tooltipcontent = $tooltip.find(".tooltipcontent")


		$tooltipcontent.html(this.message(data));

		//$tooltip.css({"top":pos.y+10+$(window).scrollTop(), "left":pos.x + $(window).scrollLeft()});
		$tooltip.css({"top":pos.y+10, "left":pos.x });

		$tooltip.show();
	},

	hide: function() {
		$tooltip = this.$el;
		$tooltip.hide();
	},

	message: function(data) {
		var format = d3.format(",d")
		msg = data.nombre;
		return msg
	},


	render: function() {
		$tooltip = this.$el
		$tooltip.hide();
		$tooltip.attr("style", "background:#ffff99;width:350px;position:absolute;z-index:9999;border-radius:8px");

		$tooltipcontent = $("<div>")
			.attr("class", "tooltipcontent")
			.attr("style", "padding:4px;border:1px solid");

		$tooltip.append($tooltipcontent);
		$tooltip.appendTo($("body"));

		this.hide();

		return this;
	}
});

// VistaCarrerasPixelMapV
// ----------------------
// Genera una columna compuesta de pequeños rectángulos (cada uno represnetando a una carrera)
var VistaCarrerasPixelMapV = Backbone.View.extend({
	el:"svg",



	initialize: function() {
		this.data = (this.options && this.options.data) ? this.options.data : [];
		this.width = (this.options && this.options.width) ? this.options.width : 1000;
		this.radious = (this.options && this.options.radious) ? this.options.radious : 3;
		this.maxColumns = Math.floor(this.width/(this.radious*2));
		this.maxRows = Math.ceil(this.data.length/this.maxColumns);
		this.indent = (this.options && this.options.indent) ? this.options.indent : 0;
		this.label = (this.options && this.options.label) ? this.options.label : "";
		this.label2 = (this.options && this.options.label2) ? this.options.label2 : "";
		this.tooltip = $("<div>");
		this.render();
	},

	render: function() {
		var data = this.data;
		var maxColumns = this.maxColumns;
		var radious = this.radious;
		var maxRows = this.maxRows;

		var w = this.width;
		var h = maxRows*radious*2+radious;

		var svg = d3.select(this.el).attr("width", w).attr("height", h)

		label1 = svg.append("text")
			.text(this.label)
			.attr("font-family", "sans-serif")
			.attr("x", "0").attr("y", "20")
          	.attr("font-size", "10px")
            .attr("fill", "gray");

        if (this.label2) {
        	label1.attr("y", "10")
        	svg.append("text")
				.text(this.label2)
				.attr("font-family", "sans-serif")
				.attr("x", "0").attr("y", "20")
	          	.attr("font-size", "10px")
	            .attr("fill", "gray");
        }


		this.nodes = svg.selectAll("rect.node-dot")
		     .data(data, function(d) { return d.CODIGO_UNICO; })
		     .enter()
		     	.append("svg:rect")
		     	.attr("class", "node-dot")
		     	.attr("width", radious)
		     	.attr("height", radious)
		     	.attr("class", function(d) {
					var myclass = "node-dot";
					myclass += d.ACREDITACION_CARRERA=="Acreditada" ? " acreditada" : " noAcreditada";
					return myclass;
				})
		     	.attr("x", function(d, i)
		     	{
		     		var row = Math.floor(i/maxColumns);
		     		var col = i % maxColumns;
		     		var x = col*radious*2 + radious;
		     		var y = row*radious*2 + radious;
		     		return x;
		     	})
		     	.attr("y", function(d, i)
		     	{
		     		var row = Math.floor(i/maxColumns);
		     		var col = i % maxColumns;
		     		var x = col*radious*2 + radious;
		     		var y = row*radious*2 + radious;
		     		return y+20;
		     	})
		     	.on("mouseover", function(d) {
		     		pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
				.on("mouseout", function(d) {self.tooltip.hide()})


	}

})

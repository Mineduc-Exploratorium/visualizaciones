

$().ready(function() {
	vista = new VistaFinanciamiento({el:"#mainchart"});
});

// VistaFinanciamiento
// ===================
// Vista principal con datos de financiamineto de establecimientos que incluye
// - Panel de opciones de selección: VistaPanelOpciones
// - Area central del gráfico (VistaLeyendaSVG, VistaEjesXY )
// - Nota explicativa (VistaNotaResumen)
// - Tooltip con reseña del establecimiento
//
var VistaFinanciamiento = Backbone.View.extend({
	el:"body",
	
	initialize: function() {
		_.bindAll(this,"selectVisualizacion","selectVulnerablidad")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 40},
    	this.width = 800 - this.margin.left - this.margin.right,
    	this.height = 500 - this.margin.top - this.margin.bottom;

    	// Panels con opciones de visualización	(genera eventos selectVisualizacion o selectVulnerablidad
    	// según las opciones seleccionadas)	
		this.vistaOpciones= new VistaPanelOpciones();
		this.vistaOpciones.on("selectVisualizacion", this.selectVisualizacion);
		this.vistaOpciones.on("selectVulnerablidad", this.selectVulnerablidad);

		// Vista con nota que incluye resumen de los datos
		this.notaResumen  = new VistaNotaResumen();

		// Vista con tooltip para mostrar ficha de establecimiento
		this.tooltip = new VistaToolTipEstablecimiento();

		// Genera escalas utilizadas en gráfico X/Y
		this.xScale = d3.scale.linear()
    		.range([0, this.width]);

		this.yScale = d3.scale.linear()
    		.range([this.height, 0]);

    	// Vista con ejes X e Y utilizados en gráfico X/Y
    	this.ejes = new VistaEjesXY({
    		x : this.xScale,
    		y : this.yScale,
    		width : this.width,
    		height : this.height,
    		labelX : "Financiamiento",
    		labelY : "PSU Lenguaje"
    	}); 

    	// Genera Pack Lyout para distribuir bubbles de establecimientos
		var diameter = this.height;
		this.pack = d3.layout.pack()
			//.sort(null)
			.size([diameter - 4, diameter - 4])
			.children(function(d) {return d.values})
			.value(function(d) { return d.financiamiento; });

		// Indicador de la vista a desplegar ("espiral" o "chart")
		this.currentView="espiral";

    	// Carga de datos
    	// Origen TSV con columnas:
    	// agno	rbd	nombre_establecimiento	nombre_comuna	numero_region	dependencia	area_geografica	
    	// financiamiento	psu_lenguaje	psu_matematica	ive_basica	ive_media	numero_alumnos
    	//
		this.$el.append("<progress id='progressbar'>Cargando datos ...</progress>");
		d3.tsv("data/financiamiento2011.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data2011 = _.filter(data, function(d) {return d.agno==2011});

			// Calcula el dominio de las escalas en base al valos de los datos que van en ejes 
			// x (psu Lenguaje) e y (financiamiento)
			self.xScale.domain(d3.extent(data, function(d) { return parseInt(d.financiamiento)})).nice();
			self.yScale.domain(d3.extent(data, function(d) { return d.psu_lenguaje; })).nice();

			self.render();
		});
	},


	// selectVulnerablidad
	// --------------------
	// Función llamada luego de detectar evento "selectVulnerablidad" en panel con opciones
	selectVulnerablidad: function(vulnerabilidad) {
		//vulnerabilidad:  "alta", "baja" o "todos"
		// Actualiza el pack con los nodos (redefine posiciones y tamaño)
		this.updateNodes(vulnerabilidad);

		// Vuelve a mostrar nodos en el gráfico
		this.renderViz();
	},


	// selectVisualizacion
	// --------------------
	// Función llamada luego de detectar evento "selectVisualizacion" en panel con opciones
	selectVisualizacion: function(viztype) {
		// viztype: "espiral" o "chart"

		this.currentView = viztype;
		this.renderViz();							
	},

	// renderVis
	// ---------
	// Presenta la visualizacion de los establecimientos en alguna de las modalidades (Espiral o Gráfico)
	// delendiendo del tipo de visualización seleccionada (this.currentView)
	renderViz: function() {
		// Vista de "espiral"  (muestra nodos en espiral)
		if (this.currentView == "espiral") {
			// Oculta los ejes x & y, cambiando su opacidad a 0
			d3.selectAll(".axis")
				.transition()
				.duration(3000)
				.attr("opacity",0);

			// Cambia la ubicación de cada nodo de acuerdo a los datos d.x & d.y definidos por el pack layout
			this.nodes
				.transition()
				.duration(3000)
			  .attr("cx", function(d) { return d.x; })
			  .attr("cy", function(d) { return d.y; })
			  .attr("r", function(d) { return d.r});
		} else 
		// Vista de "chart" (muestra nodos en gráfico x/y)
		{
			self = this; // Alias a this para ser usado en callback functions

			// Show x & y axis
			d3.selectAll(".axis")
				.transition()
				.duration(3000)
				.attr("opacity",1);

			// Relocate nodes positions & set size
			this.nodes
				.transition()
				.duration(3000)
			  .attr("cx", function(d) { return self.xScale(d.financiamiento); })
			  .attr("cy", function(d) { return self.yScale(d.psu_lenguaje); })
			  .attr("r", function(d) { return d.values ? 0 : d.r});

		}

	},


	// Creates, deletes or updates nodes (circles) corresponding to schools
	updateNodes: function(vulnerabilidad) {
		var self = this;
		var format = d3.format(",d");

		// Filter the data array according to vulnerability
		var filteredData = this.data2011;

		if (vulnerabilidad=="alta") {
			filteredData = _.filter(this.data2011, function(d) {return d.ive_media>50})
		} else if (vulnerabilidad=="baja") {
			filteredData = _.filter(this.data2011, function(d) {return d.ive_media<=50})
		}

		// Actualiza nota con datos de la selección de establecimientos
		var totalEstablecimientos = filteredData.length;
		var totalFinanciamiento = _.reduce(filteredData, function(memo, item){ return memo + parseInt(item.financiamiento); }, 0);
		var totalEstudiantes = _.reduce(filteredData, function(memo, item){ return memo + parseInt(item.numero_alumnos); }, 0);

		this.notaResumen.setTotalEstudiantes(totalEstudiantes);
		this.notaResumen.setTotalFinanciamiento(totalFinanciamiento);
		this.notaResumen.setTotalEstablecimientos(totalEstablecimientos);
		this.notaResumen.render();

		// Create list and size of nodes according to a Pack Layout (spiral bubbles)
		this.nestedData = d3.nest()
			.key(function(d) {return "Chile";})
			.entries(filteredData);

		this.mynodes = this.pack.nodes(this.nestedData[0]);

		// Join data and nodes (circles)
		this.nodes = this.svg.selectAll(".node")
			.data(this.mynodes.filter(function(d) { return (d.key!="Chile"); }), function(d) {return d.key ? d.key : d.rbd});

		// Remove discarded nodes
		this.nodes.exit()
			.transition()
			.duration(3000)
				.attr("cx", function(d) { return 0; })
				.attr("cy", function(d) { return 0; })
				.attr("r", function(d) { return 0; })
				.remove();
		
		// Create new nodes
		this.nodes.enter()
			.append("circle")
			.attr("class", nodeClass)
			.on("mouseenter", function(d) {
				var event = d3.event;
				pos = {x: event.x, y: event.y};
				self.tooltip.show(d, pos);
			})
			.on("mouseleave", function(d) {
				self.tooltip.hide()
			});

		function nodeClass(d) {
			// Checa si es un nodo final (contiene atributo values)
			if (d.values) {
					return "node"
				} else {
					return d.dependencia=="Municipal" ? "leaf node municipal" : "leaf node otro"; 
				}
		};
	},

	render: function() {
		$element = this.$el;

		// Mostrar panel con opciones
		$element.append(this.vistaOpciones.render().$el);

		// Contenedor principal SVG
		// ------------------------
		// Genera elemento SVG contenedor principal de gráficos
		this.svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		// $svgroot utilizado por JQuery para agregar elementos
		this.$svgroot = $("svg").find("g");

		// Despliega ejes X e Y (ocultos)
		this.$svgroot.append(this.ejes.render().el);
		
		// Agregar leyenda
		var leyendaSVG = new VistaLeyendaSVG({ 
			data: [{color:"blue", category:"Municipal"}, {color:"red", category:"Part. Subvencionado"}],
			width: 18}).render().el;

		this.$svgroot
			.append($(leyendaSVG).attr("transform", "translate(600,0)"));
		// ------------------------

		//Despliega  Nota con resumen
		$element.append(this.notaResumen.render().$el);

		// Genera tooltip (oculto) para mostrar datos de establecimientos
		$("body").append(this.tooltip.render().$el);

		// Actualiza cálculo de posiciones y tamaños de nodos y muestra visualización
		this.updateNodes();
		this.renderViz();
	}

});

// VistaToolTipEstablecimiento
// ----------------------------
// Muestra tooltip con mini ficha del establecimiensto (se ubica al hacer rollover sobre el establecimiento)
var VistaToolTipEstablecimiento = Backbone.View.extend({

	initialize: function() {
		this.datoestablecimiento = {
			nombre_establecimiento : "sin establecimiento",
			rbd:0,
			nombre_comuna : "sin comuna",
			financiamiento : 0,
			psu_lenguaje : 0,
			psu_matematica : 0,
			ive_media : 0,
			numero_alumnos : 0
		}
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

		var format = d3.format(",d")

		$tooltipcontent.html(data.nombre_establecimiento+" ("+data.rbd + ") -"+data.nombre_comuna);
		$tooltipcontent.append("<br>Financiamiento público 2011: $" + format(data.financiamiento))
		$tooltipcontent.append("<br>PSU Leng: " + data.psu_lenguaje +" PSU Mat: "  + data.psu_matematica);
		$tooltipcontent.append("<br>Índice de vulnerabilidad (media): " + Math.round(data.ive_media)+"%");
		$tooltipcontent.append("<br>Matrícula total: " + data.numero_alumnos +" ( $"+format(Math.round(data.financiamiento/data.numero_alumnos))+"/est. en promedio)" );

		$tooltip.css({"top":pos.y+10+$(window).scrollTop(), "left":pos.x-200});

		$tooltip.show();
	},

	hide: function() {
		$tooltip = this.$el;
		$tooltip.hide();
	},


	render: function() {
		$tooltip = this.$el
		$tooltip.hide();
		$tooltip.attr("style", "background:#ffff99;width:350px;position:absolute;z-index:9999");

		$tooltipcontent = $("<div>")
			.attr("class", "tooltipcontent")
			.attr("style", "padding:4px;border:1px solid");

		$tooltip.append($tooltipcontent);
		$tooltip.appendTo($("body"));

		this.hide();

		return this;
	}
});


// VistaNotaResumen
// ==================
// Crea un div con un texto que resume la cantidade de establecimientos, financiamiento total y cantidad de estudientes
var VistaNotaResumen = Backbone.View.extend({

	initialize: function() {
		this.totalEstudiantes = "";
		this.totalFinanciamiento = "";
		this.totalEstablecimientos = "";
	},

	setTotalEstudiantes: function(totalEstudiantes) {
		this.totalEstudiantes = totalEstudiantes;
	},

	setTotalFinanciamiento: function(totalFinanciamiento) {
		this.totalFinanciamiento = totalFinanciamiento;
	},

	setTotalEstablecimientos: function(totalEstablecimientos) {
		this.totalEstablecimientos = totalEstablecimientos;
	},

	render: function() {
		var format = d3.format(",d");

		this.$el.addClass("muted");
		this.$el.html("Selección de "+ this.totalEstablecimientos+" establecimientos que atendieron a "+format(this.totalEstudiantes)+" estudiantes en 2011.<br>");
		this.$el.append("El 2011 recibieron un financiamiento público total de $"+format(this.totalFinanciamiento)+".<br>");
		this.$el.append("($"+format(Math.round(this.totalFinanciamiento/this.totalEstudiantes))+"/estudiante en promedio)");
		
		return this;
	}

});

// VistaPanelOpciones
// ==================
// Crea un panel con opciones para seleccionar opciones de visualización
var VistaPanelOpciones = Backbone.View.extend({
	events: {
		"click button.visualizacion": "selectVisualizacion",
		"click button.vulnerabilidad" : "selectVulnerablidad"
	},

	selectVisualizacion: function(e) {
		var viztype = $(e.target).attr("viztype");
		this.trigger("selectVisualizacion", viztype);
	},

	selectVulnerablidad: function(e) {
		var vulnerabilidad = $(e.target).attr("vulnerabilidad");
		this.trigger("selectVulnerablidad", vulnerabilidad)
	},

	initialize: function() {

	},

	render: function() {
		$btngrp0 = $('<div class="btn-group" data-toggle="buttons-radio">');
		$btngrp0.append('<button type="button" class="btn btn-primary visualizacion active" viztype="espiral"><i class="icon-globe"></i>Overview (Financiamiento por establecimiento)</button>');
		$btngrp0.append('<button type="button" class="btn btn-primary visualizacion" viztype="chart"><i class="icon-signal"></i>Financiamiento vs PSU</button>');
		
		$btngrp1 = $('<div class="btn-group" data-toggle="buttons-radio">');
		$btngrp1.append($('<button type="button" class="btn btn-info vulnerabilidad active" vulnerabilidad="todos">Todos</button>'))
		$btngrp1.append($('<button type="button" class="btn btn-info vulnerabilidad" vulnerabilidad="alta">Solo vulnerables (ive > 50%)</button>'))
		$btngrp1.append($('<button type="button" class="btn btn-info vulnerabilidad" vulnerabilidad="baja">Solo menos vulnerables (ive <50%)</button>'))

		this.$el.append($btngrp0).append($("<br>")).append($btngrp1);

		return this;
	}
});

// VistaLeyendaSVG
// ===============
// Crea un cuadro de leyenda con códigos de colores asociados a grupos.  Se genera un cuadro con cada color y un texto que le 
// acompaña (en forma vertical).
//
// data: definición de la leyenda en formato [{color:"blue", category:"Category1"}, {color:"red", category:"Category2"}]
// width: ancho de la leyenda (se alinea a la derecha)
// el:  elemento svg en el cual se incorporará la leyenda (si se omite se crea un elemento <g></g>)
//
var VistaLeyendaSVG = Backbone.View.extend({
	tagName: "g",

	initialize : function(options) {
		// Si no viene parámetro el, es necesario crear un nuevo elemento en el namespace de SVG (no basta this.$el)
		this.el = (options && options.el) ? this.el : document.createElementNS('http://www.w3.org/2000/svg', this.tagName);
		this.legendData = (options && options.data) ? options.data : [{color:"blue", category:"Category"}];
		this.width = (options && options.width) ? options.width : 800;
		this.render();
	},

	render: function() {
		var legend = d3.select(this.el).selectAll(".legend")
		  .data(this.legendData)
		.enter().append("g")
		  .attr("class", "legend")
		  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
		  .attr("x", this.width - 18)
		  .attr("width", 18)
		  .attr("height", 18)
		  .style("fill", function(d) {return d.color});

		legend.append("text")
		  .attr("x", this.width - 24)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  .style("text-anchor", "end")
		  .text(function(d) { return d.category; });

		return this
	}

});


// VistaEjesXY
// ============
// Crea un ejes horizontal & vertical (X & Y) data las escalas (d3.scale) y los textos de los ejes.
//
// el:  elemento svg en el cual se incorporará la leyenda (si se omite se crea un elemento <g></g>)
//
var VistaEjesXY = Backbone.View.extend({
	tagName: "g",

	initialize : function(options) {
		// Si no viene parámetro el, es necesario crear un nuevo elemento en el namespace de SVG (no basta this.$el)
		this.el = (options && options.el) ? this.el : document.createElementNS('http://www.w3.org/2000/svg', this.tagName);
		this.x = (options && options.x) ? options.x : d3.scale();
		this.y = (options && options.y) ? options.y : d3.scale();
		this.height = (options && options.height) ? options.height : 500;
		this.width = (options && options.width) ? options.width : 500;
		this.labelX = (options && options.labelX) ? options.labelX : "X";
		this.labelY = (options && options.labelY) ? options.labelY : "Y";
	},

	render: function() {
		var xAxis = d3.svg.axis()
		    .scale(this.x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(this.y)
		    .orient("left");

		d3.select(this.el).append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + this.height + ")")
		  .attr("opacity",0)
		  .call(xAxis)
		.append("text")
		  .attr("class", "label")
		  .attr("x", this.width)
		  .attr("y", -6)
		  .style("text-anchor", "end")
		  .text(this.labelX);

		d3.select(this.el).append("g")
		  .attr("class", "y axis")
		  .call(yAxis)
		  .attr("opacity",0)
		.append("text")
		  .attr("class", "label")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em")
		  .style("text-anchor", "end")
		  .text(this.labelY)
		return this
	}

});



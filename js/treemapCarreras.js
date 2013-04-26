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

		this.sourcefile = "data/datos_carreras.txt";

		this.margin = {top: 20, right: 20, bottom: 30, left: 40},
    	this.width = 900 - this.margin.left - this.margin.right,
    	this.height = 600 - this.margin.top - this.margin.bottom;

		// Vista con tooltip para mostrar datos del item
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
 
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv(this.sourcefile, function(data) {
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
		var msg = "<strong>"+data["TIPO_INSTITUCION"]+"</strong>";
		msg += "<br>"+data["INSTITUCION"];
	 	msg += "<br> <span class='text-info'>"+data["CARRERA"]+"</span>";
		msg += "<br>"+"<span class='muted'>"+data.SEDE+"</span>";
		msg += "<br>"+"<span class='muted'>"+data.HORARIO+"</span>";
		msg += "<br>"+"<span class='muted'>Matriculados: "+data["TOTAL_MATRICULADOS"]+"</span>";
		msg += "<br>"+"<span class='muted'>Acreditación: "+data["ACREDITACION_CARRERA"]+"</span>";

		return msg;
	},

	render : function() {

		var treeCarreras = treeMapCarreras()
			.size([this.width, this.height])

		// Total de nodos con información de x, y, dx, dy
		var nodes = treeCarreras.nodes(this.data);

		// Títulos de grupos [{title: "CFT", width:56}, ... ]
		var titles = treeCarreras.titles();

		var color = d3.scale.ordinal()
			.range(["blue", "red"]);

		var legendPlaceHolder = d3.select(this.el).append("div")
		    .style("position", "relative")
		    .style("width", (self.width + self.margin.left + self.margin.right) + "px")
		    //.style("height", 40 + "px")
		    .style("left", self.margin.left + "px")
		    .style("top", self.margin.top + "px")
		    .style("margin", 10 + "px");

		// Div principal
		var mainDiv = d3.select(this.el).append("div")
		    .style("position", "relative")
		    .style("width", (self.width + self.margin.left + self.margin.right) + "px")
		    .style("height", (self.height + self.margin.top + self.margin.bottom) + "px")
		    .style("left", self.margin.left + "px")
		    .style("top", self.margin.top + "px");

		formatNumber = d3.format(",d");

		// Barra con Títulos de cada grupo
		mainDiv.append("div")
			.style("position", "relative")
		    .style("width", self.width + "px")
		    .style("height", 40 + "px")
		    .style("left", 0 + "px")
		    .style("top", 0 + "px")
		    .selectAll("div")
		    .data(titles)
		    .enter()
		    	.append("div")
		    	.style("float", "left")
		    	.style("width", function(d) {return d.width+"px"})
		    	.style("height", 40 + "px")
		    	.attr("class", "etiqueta")
		    	.html(function(d) {return d.title +"<br>"+formatNumber(d.size) + " estudiantes"});


		// Despliegue de los nodos de carreras
		mainDiv.selectAll(".node")
			.data(nodes)
			.enter()
				.append("div")
		  		.attr("class", function(d) {
		  			// Si son carreras
				  	if (d.depth == 1) {
				  		return d.ACREDITACION_CARRERA == "Acreditada" ? "node leaf acreditada" : "node leaf noacreditada"
				  	} else  {
				  		return "node notleaf"
				  	}
		  		})
				.call(position)
				.style("background", function(d) { return (!d.values && d.depth==1) ? color(d.ACREDITACION_CARRERA) : null; })
				.text(function(d) { return d.children ? null : d.key; })
				.on("mouseenter", function(d) {
						pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
						self.tooltip.show(d, pos)}
						)
					.on("mouseleave", function(d) {self.tooltip.hide()})
				
		var legendView = new legendHTML({el:legendPlaceHolder[0][0], scale : color})


		function position() {
		  this.style("left", function(d) { return d.x + "px"; })
		      .style("top", function(d) { return d.y +40 + "px"; })
		      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
		}
		
	},


});

var legendHTML = Backbone.View.extend({
	initialize: function() {
		this.scale = (this.options && this.options.scale) ? this.options.scale : d3.selectAll.ordinal();
		this.render();
	},

	render: function() {
		var legendItems = d3.select(this.el).selectAll(".legendItem")
			.data(this.scale.domain())
			.enter()
				.append("div")
				.style("position", "relative")
				.style("margin", 2 + "px");

		// Agregar cuadros con leyenda
		legendItems.append("div")
			.style("float", "left")
	    	.style("width", 15 + "px")
	    	.style("height", 15 + "px")
	    	.style("left", 10 + "px")
	    	.style("top", 20 + "px")
	    	.style("margin", 2 + "px")
			.style("background", this.scale)
			.attr("class", "legendItem")

		legendItems.append("div")
			.style("float", "left")
			.text(function(d) {return d})

		legendItems.append("div")
			.style("clear", "both")
			


	}
})

var treeMapCarreras = function(data) {
	var map = {};
	var size = [1,1];
	var sizeAttribute = "TOTAL_MATRICULADOS";
	var categoryAttribute = "ACREDITACION_CARRERA";
	var groupAttribute = "TIPO_INSTITUCION";
	var titles = [];


	map.nodes = function(data) {
		var dataGroups = createDataGroups(data);

		// sizes  : Objeto con los tamaños de cada grupo
		// Ej. sizes = {"CFT": 120340, "IP": 45687, ...}
		var sizes = calculateGroupSizes(dataGroups);

		// totalSize tamaño total de todos los nodos (Ej totalSize = 956875)
		var totalSize = calculateTotalSize(data);

		// ancho y alto del área de despliegue
		var w = size[0];
		var h = size[1];

		// Arreglo con las obicaciones de cada nodo
		var nodes = []

		var nextX = 0;  // Position of next group Node
		_.each(d3.keys(sizes), function(key) {
			var groupNode = {};
			groupNode.dx = w*sizes[key]/totalSize;
			groupNode.dy = h;
			groupNode.x = nextX;
			nextX = nextX + groupNode.dx;
			groupNode.y = 0;
			groupNode.depth = 0
			nodes.push(groupNode);

			var groupNodes = createGroupNodes(dataGroups[key], groupNode.x, groupNode.y, groupNode.dx, groupNode.dy, sizes[key]);
			nodes = nodes.concat(groupNodes);

		})

		// Genera un arreglo con texto y ancho de cada titulo
		titles = createTitles(sizes, totalSize);

		return nodes;
	};

	map.size = function(_) {
	    if (!arguments.length) return size;
	    size = _;
	    return map;
	}

	map.titles = function() {
		return titles;
	}

	createTitles = function(sizes, totalSize) {
		var titles = [];

		_.each(d3.keys(sizes), function(key) {
			var w = size[0];

			var title = {}
			title.title = key;
			title.width = w*sizes[key]/totalSize;
			title.size = sizes[key];

			titles.push(title);
		});

		return titles;
	}

	createDataGroups = function(data) {
		// Agrupar datos según agrupaciones
		dataGroups = _.groupBy(data, function(d) {return d[groupAttribute]});

		return dataGroups;
	}

	calculateGroupSizes = function(dataGroups) {

		// Objeto con los tamaños de cada grupo
		var sizes = {};

		_.each(d3.keys(dataGroups), function(key) {
			sizes[key] = _.reduce(dataGroups[key], function(memo, d) {
				return +d[sizeAttribute] + memo;
			}, 0);
		})
		return sizes;
	}

	calculateTotalSize = function(data) {
		var totalSize =  _.reduce(data, function(memo, d) {
				return +d[sizeAttribute] + memo;
			}, 0);
		return totalSize;
	}

	createGroupNodes = function(groupData, left, top, width, height, groupSize) {
		// Groups: CFT, IP, ...
		// Categories : Acredidata, No Acreditada

		var withinGroupCategories = _.groupBy(groupData, function(d) {
			return d[categoryAttribute];
		});

		var categories = _.sortBy(d3.keys(withinGroupCategories), function(d) {
			return d;
		});

		nodes = [];

		var nextY = 0
		_.each(categories, function(category) {
			var categorySize = _.reduce(withinGroupCategories[category], function(memo, d) {
				return +d[sizeAttribute] + memo;
			}, 0);

			
			var categoryNode = {};
			categoryNode.dx = width;
			categoryNode.dy = height*categorySize/groupSize;
			categoryNode.x = left;
			categoryNode.y = nextY;
			nextY = nextY + categoryNode.dy;
			
			categoryNode.depth = 0
			nodes.push(categoryNode);

			var nestedData = d3.nest()
				.key(function(d) {return category})
				.entries(withinGroupCategories[category]);
					 
			var treemap = d3.layout.treemap()
				.size([categoryNode.dx, categoryNode.dy])
				.sticky(true)
				.children(function(d) {return d.values })
				.value(function(d) { return d[sizeAttribute]; });

			var mapNodes = treemap.nodes(nestedData[0]);

			// Trasladar la posición de cada nodo en función del origen left, top
			mapNodes = _.map(mapNodes, function(d) {
				d.x = d.x+left;
				d.y = d.y+top+categoryNode.y;
				return d
			})

			nodes = nodes.concat(mapNodes);

		});




		return nodes;
	}

	return map
}

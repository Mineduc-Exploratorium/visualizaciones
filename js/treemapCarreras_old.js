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

		this.sourcefile = "data/matricula2012.txt";

		this.margin = {top: 20, right: 20, bottom: 20, left: 20},
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
		var msg = "<strong>"+data["CLASIFICACION INSTITUCION NIVEL 1"]+"</strong>";
	 	msg += "<br> <span class='text-info'>"+data["NOMBRE CARRERA"]+"</span>";
		msg += "<br>"+data["NOMBRE INSTITUCION"];
		msg += "<br>"+"<span class='muted'>"+data.CIUDAD+"</span>";
		msg += "<br>"+"<span class='muted'>"+data.HORARIO+"</span>";
		msg += "<br>"+"<span class='muted'>Matriculados: "+data["TOTAL MATRICULADOS"]+"</span>";

		return msg;
	},

	render : function() {
		var $button = $("<button>Filtrar</button>")
			.on("click", function() {
				self.filtrar();
			});
		$("body").prepend($button)
		var color = d3.scale.category10();


		var div = d3.select(this.el).append("div")
		    .style("position", "relative")
		    .style("width", (this.width + this.margin.left + this.margin.right) + "px")
		    .style("height", (this.height + this.margin.top + this.margin.bottom) + "px")
		    .style("left", this.margin.left + "px")
		    .style("top", this.margin.top + "px");

		var nestedData = d3.nest()
			.key(function(d) {return "Chile"})
			.key(function(d) {return d["CLASIFICACION INSTITUCION NIVEL 1"]})
			.key(function(d) {return d["NOMBRE INSTITUCION"]})
			.entries(this.data);

		var treemap = d3.layout.treemap()
    		.size([this.width, this.height])
    		.sticky(true)
    		.children(function(d) {return d.values })
    		.value(function(d) { return d["TOTAL MATRICULADOS"]; });

    	var nodes = treemap.nodes(nestedData[0]);

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
		  .text(function(d) { return d.children ? null : d.key; })
		  .on("mouseenter", function(d) {
					pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
				.on("mouseleave", function(d) {self.tooltip.hide()})

		function position() {
		  this.style("left", function(d) { return d.x + "px"; })
		      .style("top", function(d) { return d.y + "px"; })
		      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
		}


	},
	drawChart: function() {
		var self = this;

		console.log("TEST ");


		var color = d3.scale.category10();


		var div = d3.select(this.el).append("div")
		    .style("position", "relative")
		    .style("width", (this.width + this.margin.left + this.margin.right) + "px")
		    .style("height", (this.height + this.margin.top + this.margin.bottom) + "px")
		    .style("left", this.margin.left + "px")
		    .style("top", this.margin.top + "px");

		var nestedData = d3.nest()
			.key(function(d) {return "Chile"})
			.key(function(d) {return d["CLASIFICACION INSTITUCION NIVEL 1"]})
			.key(function(d) {return d["NOMBRE INSTITUCION"]})
			.entries(this.data);

		var treemap = d3.layout.treemap()
    		.size([this.width, this.height])
    		.sticky(true)
    		.children(function(d) {return d.values })
    		.value(function(d) { return d["TOTAL MATRICULADOS"]; });

    	var nodes = treemap.nodes(nestedData[0]);

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
		  .text(function(d) { return d.children ? null : d.key; })
		  .on("mouseenter", function(d) {
					pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
				.on("mouseleave", function(d) {self.tooltip.hide()})

		function position() {
		  this.style("left", function(d) { return d.x + "px"; })
		      .style("top", function(d) { return d.y + "px"; })
		      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
		}

	},
	
filtrar : function(){
		this.data2 = _.filter(this.data, function(d) {return parseInt(d.INSTITUCION)=="Universidades"})
	

			this.drawChart();


	},



});



$().ready(function() {
	console.log("ready");
	vista = new VistaPrincipal({el:"#mainchart"});
});

// VistaPrincipal
// ===================
// Vista principal con datos de ...
//
var VistaPrincipal = Backbone.View.extend({
	
	el:"body",

	events : {
	

	},
	
	initialize: function() {
	
		_.bindAll(this,"render", "zoomed")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 200},
    	this.width = 1000 - this.margin.left - this.margin.right,
    	this.height = 400 - this.margin.top - this.margin.bottom;

		// Vista con tooltip para mostrar ficha de establecimiento
		//this.tooltip = new VistaToolTipEstablecimiento();
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
		
		this.attrx = "arancel";
		this.attry = "ingresoagno4";
		this.attrsize = "empleabilidadagno1";
 		this.attrcolor = "acreditacion";
 		
 
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/empleabilidad.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
			//
		});
	},

	mousetrack : function(e) {
		//console.log(e.pageX)
	},

	tootipMessage : function(data) {
	
		formatMiles = d3.format(",d");
		formatDecimal = d3.format('.2f')

		msg = data.carrera + " - " + data.institucion + "<br>";
		msg += "Duración: " + data.duracion +" años<br>";
		msg += "Deserción Año 1: " + data.desercionagno1 +"%<br>";
		msg += "Arancel: $" + formatDecimal(data.arancel)+" millones<br>";
		msg += "Ingreso al 4 Año: " + data.ingresoagno4+"<br>";
		msg += "Acreditación: " + data.acreditacion+"<br>";
		msg += "Empleabilidad: " + data.empleabilidadagno1+"<br>";
		return msg;
	}, 

	
	cleanStringInt: function(n) {

		//return n.replace("$", "").replace(" ", "").replace(".", "").replace(",", "").replace(/\.|%/g,'');
		return n;
	},

	updateNodes: function() {
		console.log("updateNodes");
		var self = this;

		var color = d3.scale.category10();

		this.filtereData = _.filter(this.data, function(d) {
			return (parseFloat(d[self.attrx])>0) && (d.area == self.area)
					&& (d[self.attry] != "s/i");
		});

		// Calcula el dominio de las escalas en base al valos de los datos que van en ejes 
		// x (psu Lenguaje) e y (financiamiento)
		this.xScale.domain(d3.extent(this.data, function(d) { return parseFloat(d[self.attrx])})).nice();
		//this.yScale.domain(d3.extent(this.data, function(d) { return parseFloat(d[self.attry])})).nice();



		//alert(this.yScaleIngreso(" De $600 mil a $800 mil "));


		d3.select(".x.axis")
			.transition()
			.duration(2000)
			.call(this.xAxis)
			.select("text.label")	
				.transition()
				.text(this.etiquetas[this.attrx]);;

		this.nodes = this.svg.selectAll("circle")
			.data(this.filtereData, function(d) {return d.ID})

		this.nodes.exit()
				.transition()
				.duration(2000)
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", 0)
				.remove()
		
		this.nodes.enter()
				.append("circle")
				.attr("opacity", 0.8)
				.on("mouseenter", function(d) {
					pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
				.on("mouseleave", function(d) {self.tooltip.hide()})

		this.nodes
				.transition()
				.duration(2000)
				.attr("cx", function(d) {return self.xScale(self.cleanStringInt(d[self.attrx]))})
				.attr("cy", function(d) {return self.yScale(d[self.attry])})
				.attr("r", function(d) {return self.radious(d[self.attrsize])})
				.attr("fill", function(d) {return self.colorAcreditacion(d[self.attrcolor])})

		// Crea Ejes para X e Y
		this.ejes.labelX = this.etiquetas[this.attrX];
		this.ejes.labelY = this.etiquetas[this.attrY];

		this.ejes.redraw();

	},

	zoomed: function() {  
		console.log("zoomed");
		var self = this;			
		console.log("here", d3.event.translate, d3.event.scale);

		this.svg.select(".x.axis").call(this.xAxis);
		this.svg.select(".y.axis").call(this.yAxis);

			this.nodes
				.attr("cx", function(d) {return self.xScale(self.cleanStringInt(d[self.attrx]))})		
	},


	render: function() {
		console.log("render");
		self = this; // Para hacer referencia a "this" en callback functions

		this.data = _.map(this.data, function(d) {
			d.desercionagno1 = parseFloat(d.desercionagno1.replace(/\.|%/g,'').replace(/,/g,'.')).toString();
			d.duracion = (parseFloat(d.duracion.replace(/,/g,'.'))/2).toString();
			d.arancel = (parseFloat((d.arancel+"").replace(/\.|\$| /g,''))/1000000);
			d.empleabilidadagno1 = parseFloat(d.empleabilidadagno1.replace(/\.|%/g,'').replace(/,/g,'.')).toString();
			return d;
		})

		this.carrerasXArea = d3.nest()
			.key(function(d) {return d.area})
			.entries(this.data);

		d3.select(this.el).append("select")
			.attr("class", "area")
			.selectAll("option")
			.data(this.carrerasXArea)
			.enter()
				.append("option")
				.attr("value", function(d) {return d.key})
				.text(function(d) {return  d.key})

		var categoriesAcreditacion = [
			"7 años", 
			"6 años", 
			"5 años",
			"4 años", 
			"3 años", 
			"2 años", 
			"En Proceso",
			"No"];

		this.colorAcreditacion = d3.scale.ordinal()
		    .domain(categoriesAcreditacion)
		    .range(d3.range(categoriesAcreditacion.length).map(d3.scale.linear()
		      .domain([0, categoriesAcreditacion.length - 1])
		      .range([d3.rgb(0, 0, 0), d3.rgb(255, 255, 255)])
		      .interpolate(d3.interpolateLab)));

		this.etiquetas = {
			"desercionagno1": "Deserción Año 1 (%)",
			"duracion": "Duración (años)",
			"arancel" : "Arancel (millones $)",
			"empleabilidadagno1" : "Empleabilidad Año 1 (%)",
			"ingresoagno4" : "Ingresos Año 4"
		};
			

		var opciones = ["arancel", "duracion",  "empleabilidadagno1","desercionagno1"];

		d3.select(this.el).append("select")
			.attr("class", "attrx")
			.selectAll("option")
			.data(opciones)
			.enter()
				.append("option")
				.attr("value", function(d) {return d})
				.text(function(d) {return self.etiquetas[d]})


			// Genera elemento SVG contenedor principal de gráficos
		this.svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	

			// Genera escalas utilizadas en gráfico X/Y
		this.xScale = d3.scale.linear()
    		.range([0, this.width]);

		var zoom = d3.behavior.zoom()
		    .x(this.xScale)
		    //.y(y)
		    //.scaleExtent([1, 10])
		    .on("zoom", this.zoomed);

		//this.svg
		//	.call(zoom)


		//this.yScale = d3.scale.linear()
    	//	.range([this.height, 0]);

    	var domainIngreso= [
    	 	" Menor a $400 mil ",
    		" De $400 mil a $600 mil ",
			" De $600 mil a $800 mil ",
			" De $800 mil a $1 millón ",
			" De $1 millón a $1 millón 200 mil ",
			" De $1 millón 200 mil a $1 millón 400 mil ",
			" De $1 millón 400 mil a $1 millón 600 mil ",
			" De $1 millón 600 mil a $1 millón 800 mil ",
			" De $1 millón 800 mil a $2 millones ",
			" Sobre $2 millones "
		]
		this.yScale = d3.scale.ordinal()
			.domain(domainIngreso)
			.rangePoints([this.height, 0], 1);

		// Calcula el dominio de las escalas en base al valos de los datos que van en ejes 
		// x (psu Lenguaje) e y (financiamiento)
		this.xScale.domain(d3.extent(this.data, function(d) { return parseFloat(self.cleanStringInt(d[self.attrx]))})).nice();
		//this.yScale.domain(d3.extent(this.data, function(d) { return parseFloat(self.cleanStringInt(d[self.attry]))})).nice();

		// Escala para calcular el radio de cada circulo
		this.radious = d3.scale.sqrt()
			.range([2, 8])
			.domain(d3.extent(this.data, function(d) { return parseFloat(d[self.attrsize])}));

	
		this.xAxis = d3.svg.axis()
		    .scale(this.xScale)
		    .orient("bottom");

		this.yAxis = d3.svg.axis()
		    .scale(this.yScale)
		    .orient("left");

		
 	console.log(this.etiquetas[this.attrX]);
 	this.ejes = new VistaEjesXY({
			svg: this.svg,
			x:this.xScale, y:this.yScale, 
			height: this.height, width: this.width, 
			labelX: this.etiquetas[this.attrX],labelY: this.etiquetas[this.attrY]
		})
 // Construye la leyenda
		this.legend = new VistaLeyendaSVG({
			svg: this.svg,
			scale : this.colorAcreditacion,
			width: this.width,
			left: this.width,
			top:30

		});

		$(this.el).find("svg").find("g").first().append($(this.legend.el));

		this.updateNodes();

	

	}

});


 

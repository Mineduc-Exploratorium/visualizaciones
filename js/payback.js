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
		"change select#id_inputArea" : "selectArea"
	},
	
	initialize: function() {
		console.log("initialize");

		//Añadidas referencias a funciones de los nuevos eventos **Carlos

		_.bindAll(this,"render", "zoomed", "selectTipoIE")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 200},
    	this.width = 1000 - this.margin.left - this.margin.right,
    	this.height = 400 - this.margin.top - this.margin.bottom;


    	//Añadidos paneles que gatillan los nuevos eventos **Carlos

 
		// Vista con tooltip para mostrar ficha de establecimiento
		//this.tooltip = new VistaToolTipEstablecimiento();
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
		
		this.attrx = "costo_estimado";
		this.attry = "ingreso_agno4";
		this.attrsize = "empleabilidad_agno1";
 		this.area = "Administración y Comercio"
 		this.attrTipoIE = "tipo_institucion_nivel_0";
  		this.attrcolor = this.attrTipoIE;
  		this.tipoIE = "todos";  // Selector inicial del tipo IE

  		// Etiquetas utilizadas en ejes X e Y
		this.etiquetas = {
			"desercionagno1": "Deserción Año 1 (%)",
			"duracion": "Duración (años)",
			"arancel" : "Arancel (millones $)",
			"empleabilidadagno1" : "Empleabilidad Año 1 (%)",
			"ingreso_agno4" : "Ingresos Año 4",
			"costo_estimado" : "Costo estimado (arancel x duracion)"
		};

    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/empleabilidad2.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
			//
		});
	},


	mousetrack : function(e) {
		//console.log(e.pageX)
	},

	// tooltipMessage
	// --------------
	// Reescribe función generador de mensajes utilizado en herramienta de tooltip
	// tooltip.tooltipMessage(data)
	// Parámetros:
	// data: objeto con atributos (Ej: {nombre: "Juan", Edad: 18})
	tootipMessage : function(data) {
	
		formatMiles = d3.format(",d");
		formatDecimal = d3.format('.2f')

		msg = "<strong>"+data.institucion+"</strong>";
		msg += "<br><span class='text-info'>"+data.carrera+"</span>";
		msg += "<br>Duración: " + data.duracion_real +" años";
		msg += "<br>Arancel: $" + formatMiles(data.arancel)+" millones";
		msg += "<br>Costo estimado (arancel x duracion): $" + formatDecimal(data.costo_estimado/1000000)+" millones";
		
		return msg;
	}, 


	// Selecciona un nuevo tipo de institucion
	// Parámetros:
	// tiposSeleccionados:  arreglo con texto de tipos de IEs seleccionados (Ej. ["Centros e Formación Técnica", "Universidades"])
	selectTipoIE : function(tiposSeleccionados) {
		this.tiposSeleccionados = tiposSeleccionados;
		this.reDraw();
	},

	selectArea : function(e) {
		console.log("selectArea");
		option = $(e.target).val();

		this.area= option;
		this.reDraw();
	},

	cleanStringInt: function(n) {

		//return n.replace("$", "").replace(" ", "").replace(".", "").replace(",", "").replace(/\.|%/g,'');
		return n;
	},

	reDraw: function() {
		console.log("reDraw");
		var self = this;

		var color = d3.scale.category10();

		// Filtrar los datos por el area seleccionada (Ej. Educación) y adicionalmente
		// por aqellos que tengan attrx >0 & attry != a "s/i"
		this.filteredData = _.filter(this.data, function(d) {
			return (parseFloat(d[self.attrx])>0) && (d.area == self.area)
					&& (d[self.attry] != "s/i");
		});

		// Calcula el dominio de las escala x en base al valos de los datos que van en ejes 
		this.xScale.domain(d3.extent(this.filteredData, function(d) { return d[self.attrx]})).nice();

		// Join entre datos y nodos tipo "circle"
		this.nodes = this.svg.selectAll("circle")
			.data(this.filteredData, function(d) {return (d.institucion+d.carrera)})

		// Eliminar los nodos para los cuales no hay asociación de datos
		this.nodes.exit()
				.transition()
				.duration(2000)
				.attr("cx", 0)
				.attr("cy", this.height)
				.attr("r", 0)
				.remove()

		// Agregar nuevos nodos asociados a datos
		this.nodes.enter()
				.append("circle")
				.attr("opacity", 0.8)
				.attr("cx", 0)
				.attr("cy", this.height) // Los ubica en esquina inferior izquierda originalmente
				// Captura eventos para uso de tootlip
				.on("mouseenter", function(d) {
					pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
				.on("mouseleave", function(d) {self.tooltip.hide()})

		// Actualizar despliegue de nodos existentes
		this.nodes
				.transition()
				.duration(2000)
				.attr("cx", function(d) {return self.xScale(self.cleanStringInt(d[self.attrx]))})
				.attr("cy", function(d) {return self.yScale(d[self.attry])})
				.attr("r", function(d) {return 10})
				.attr("fill", function(d) {return self.color(d[self.attrcolor])})
				.attr("opacity", function(d) {
					// Verificar si el tipo de IE está cintenida en los tipos seleccionados
					// y asignar valor de opacidad en concordancia
					return _.contains(self.tiposSeleccionados, d[self.attrTipoIE]) ? 0.95 : 0.05
				})


		// Crea Ejes para X e Y
		this.ejes.labelX = this.etiquetas[this.attrx];
		this.ejes.labelY = this.etiquetas[this.attry];

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

		$element = this.$el;

		// Limpia datos de entrada (P.Ej. Cambiar duración de semestres a años)
		this.data = _.map(this.data, function(d) {
			//d.desercionagno1 = parseFloat(d.desercionagno1.replace(/\.|%/g,'').replace(/,/g,'.')).toString();
			d.duracion_real = d.duracion_real/2;  // Cambiar a años
			d.costo_estimado = d.arancel*d.duracion_real; // Genera nuevo atributo de costo carrera
			return d;
		})

		//Calcula parámetros que dependen de los datos

		// Tipos de IE (Universidades, CFT, ...)
		// Es utilizado para cambiar el color de cada nodo 
		this.tiposIEs = _.unique(_.pluck(this.data, this.attrTipoIE)).sort();

		// Arreglo con los tidos de IES que están seleccionados para mostrarsse de manera destacada
		// originalmente se sólo la última opción
		this.tiposSeleccionados = this.tiposIEs;  

		// Obtiene un arreglo con los nombres de las áreas
		this.areas = _.unique(_.pluck(this.data,"area")).sort();

		this.color = d3.scale.category10();
		this.color.domain(this.tiposIEs);

		// Panels con opciones de visualización	(genera eventos selectVisualizacion o selectVulnerablidad
    	// según las opciones seleccionadas)	
		this.vistaOpciones= new VistaPanelOpciones({el:"#panelOpciones"});
		this.vistaOpciones.on("selectTipoIE", this.selectTipoIE);
		this.vistaOpciones.setColorScale(this.color);
				// Mostrar panel con opciones
		//$element.append(this.vistaOpciones.render().$el);
		this.vistaOpciones.render();


		// Genera menu con opciones de Area del Conocimiento (Educación, Ciencias Sociales, ...)
		var selectorArea = d3.select(this.el)
			.append("form")
				.attr("class", "form-inline")
			.append("div")
				.attr("class", "control-group")

		selectorArea.append("label")
			.attr("class", "control-label")
			.attr("for", "id_inputArea")
			.text("Area");

		selectorArea.append("select")
			//.attr("class", "area")
			.attr("id", "id_inputArea")
			.selectAll("option")
			.data(this.areas)
			.enter()
				.append("option")
				.attr("value", function(d) {return d})
				.text(function(d) {return  d})



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
    	 	"Menor a $400 mil",
    		"De $400 mil a $600 mil",
			"De $600 mil a $800 mil",
			"De $800 mil a $1 millón",
			"De $1 millón a $1 millón 200 mil",
			"De $1 millón 200 mil a $1 millón 400 mil",
			"De $1 millón 400 mil a $1 millón 600 mil",
			"De $1 millón 600 mil a $1 millón 800 mil",
			"De $1 millón 800 mil a $2 millones",
			"Sobre $2 millones"
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
		    .orient("left")


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

		this.reDraw();

	}

});


 
// VistaPanelOpciones
// ==================
// Crea un panel con opciones para seleccionar opciones de visualización
var VistaPanelOpciones = Backbone.View.extend({
	events: {
		"change input": "selectTipoIE",
	},

	initialize: function() {
		this.colorScale = d3.scale.ordinal();

	},

	selectTipoIE: function(e) {
		// Obtiene arreglo con botones activos
		$(this.el).find("input:checked")

		var selectedButtons = d3.select(this.el).selectAll("input:checked")[0];

		// Genera un arreglo con el texto de cada botón activo
		var selectedValues = _.map(selectedButtons, function(d) {
			return $(d).val();

		})
		this.trigger("selectTipoIE", selectedValues);
	},

	// Define escala de colores que es utilizada para obtener los nombres de las opciones (domain) y 
	// los respectivos colores
	setColorScale: function(colorScale) {
		this.colorScale = colorScale;
	},

	render: function() {

		/*
		// Genera un grupo de botones con estilo Bootstrap que operen en modalidad checkbok (se puede seleccionar más de uno)
		var btnGroup = d3.select(this.el).append("div")
			.attr("class","btn-group")


		// Genera un boton por cada categoría en la escala de colores (this.colorScale.domain())
		btnGroup.selectAll("button")
			.data(this.colorScale.domain())
			.enter()
			.append("button")
				.attr("type","button")
				.attr("class","btn")
				.style("background-color", this.colorScale)
				.text(function(d) {return d})

		*/

		var optionsGroup = d3.select(this.el).append("div")
			.selectAll("label")
			.data(this.colorScale.domain())
			.enter()
				.append("label")
				.attr("class","checkbox inline");

		optionsGroup.append("input")
			.attr("type", "checkbox")
			.attr("checked", true)
			.attr("value", function(d) {return d})


		optionsGroup.append("span")
			.text(function(d) {return d})
			.style("background-color", this.colorScale)






		// Activa el último botón (vía JQuery)
		$(this.el).find("button").last().button('toggle');

		return this;
	}
});